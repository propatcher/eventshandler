import { useState } from 'react';

export default function App() {
  // --- СОСТОЯНИЯ АВТОРИЗАЦИИ ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // --- СОСТОЯНИЯ ДАШБОРДА ---
  const [events, setEvents] = useState([
    { 
      id: 1, 
      title: 'Защита дипломного проекта', 
      date: '2026-06-20', 
      description: 'Финальная защита веб-системы перед государственной комиссией.', 
      status: 'Активно' 
    },
    { 
      id: 2, 
      title: 'Преддипломная практика (Сдача отчета)', 
      date: '2026-05-25', 
      description: 'Загрузка дневника практики и отчета в личный кабинет колледжа.', 
      status: 'Планируется' 
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Планируется');

  // --- ЛОГИКА ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    // Имитация успешного входа
    setIsAuthenticated(true);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!title || !date) return alert('Заполните название и дату!');

    const newEvent = { id: Date.now(), title, date, description, status };
    setEvents([newEvent, ...events]);
    
    setTitle(''); setDate(''); setDescription(''); setStatus('Планируется');
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  // --- ЭКРАН АВТОРИЗАЦИИ ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLoginMode ? 'Вход в систему' : 'Регистрация'}
            </h1>
            <p className="text-gray-500">Платформа управления мероприятиями</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО / Название организации</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Иван Иванов"/>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="admin@example.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input type="password" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••"/>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium py-3 transition-colors shadow-sm cursor-pointer">
              {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
            >
              {isLoginMode ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ОСНОВНОЙ ДАШБОРД ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Шапка дашборда */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
            <p className="text-gray-500 mt-1">Выпускная квалификационная работа</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Выйти
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              + Создать ивент
            </button>
          </div>
        </header>

        {/* Сетка карточек */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500 text-lg">Список мероприятий пуст. Добавьте первое!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      event.status === 'Активно' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 break-words">{event.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 break-words">{event.description || 'Описание отсутствует'}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {event.date}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors cursor-pointer"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Новое мероприятие</h3>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название мероприятия *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата проведения *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500">
                    <option value="Планируется">Планируется</option>
                    <option value="Активно">Активно</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Отмена</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer">Добавить</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}