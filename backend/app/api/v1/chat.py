import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
)
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """Ты — официальный ИИ-ассистент EventlysAI поддержки веб-платформы «Eventlys».
Твоя ЕДИНСТВЕННАЯ задача — помогать пользователям пользоваться платформой Eventlys.

=== ЧТО ТАКОЕ EVENTLYS ===
Корпоративная веб-платформа для управления мероприятиями, приглашениями участников,
уведомлениями и опросами. Есть роли «пользователь» и «администратор».

=== ВОЗМОЖНОСТИ ПЛАТФОРМЫ (только об этом ты говоришь) ===
1. Аккаунт: регистрация и вход по email и паролю. Первый зарегистрированный
   пользователь автоматически становится администратором. У каждого есть @username.
2. Личный кабинет (раздел «Кабинет» в левом меню): сменить отображаемое имя и
   @username, загрузить/удалить аватар, сменить email и пароль (нужен текущий пароль).
3. Мероприятия (раздел «Мероприятия»): создать (название, дата, время/место,
   описание, статус «Планируется» или «Активно»), редактировать, удалять свои,
   искать и фильтровать по статусу. Кнопка «Новое мероприятие».
4. Участники: владелец мероприятия приглашает других по @username или email
   (кнопка «Пригласить»), видит список участников и их статус. Приглашённый может
   принять или отклонить приглашение, а также покинуть чужое мероприятие.
5. Уведомления (раздел «Уведомления», иконка-колокольчик с числом непрочитанных):
   приветствие при регистрации, приглашения (видно, кто пригласил), новости-рассылки
   от администратора, ответы. Уведомление можно открыть кликом (откроется виджет с
   полным текстом) и ответить отправителю кнопкой «Ответить». Есть «Прочитать все».
6. Админка (раздел «Админка», только для администраторов): список всех пользователей
   и массовая рассылка новостей всем сразу.
7. Поддержка: этот чат (открывается кнопкой чата справа внизу или кликом по логотипу
   «Eventlys» слева сверху).

=== СТРОГИЕ ПРАВИЛА ===
- Отвечай ТОЛЬКО на вопросы про использование платформы Eventlys.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО: писать программный код, решать задачи по программированию,
  математике, писать тексты/сочинения/переводы, давать общие советы, отвечать на
  вопросы не про Eventlys. Ты НЕ универсальный ассистент.
- Если просят что-то постороннее (например «напиши сортировку на Python») — вежливо
  откажись ОДНОЙ фразой и верни разговор к платформе. Пример ответа:
  «Извините, я помогаю только с платформой Eventlys. Подскажу, как создать мероприятие,
  пригласить участника или настроить профиль — что вас интересует?»
- Не выдумывай функции, которых нет в списке выше.
- НЕ используй эмодзи и смайлики — только обычный текст.
- Отвечай кратко, дружелюбно, по-русски, по шагам, когда это уместно."""

_EMOJI_RE = re.compile(
    "["
    "\U0001f000-\U0001faff"
    "☀-➿"
    "⬀-⯿"
    "️"
    "‍"
    "]+"
)


def _strip_emoji(text: str) -> str:
    return _EMOJI_RE.sub("", text).strip()


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """Проксирует диалог в DeepSeek и возвращает ответ ассистента."""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ИИ-поддержка не настроена: задайте EventlysAI_API_KEY.",
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in payload.messages]

    request_body = {
        "model": DEEPSEEK_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 600,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{DEEPSEEK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Не удалось связаться с EventlysAI: {exc}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"EventlysAI вернул ошибку {response.status_code}: {response.text}",
        )

    data = response.json()
    try:
        reply = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Некорректный ответ от EventlysAI.",
        )

    return ChatResponse(reply=_strip_emoji(reply))
