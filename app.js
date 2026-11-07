// GiftTracker Pro - Professional iOS Web App
(function() {
    'use strict';

    // Data Store
    const store = {
        people: [],
        events: [],
        gifts: [],
        
        load() {
            try {
                const data = localStorage.getItem('gifttracker_pro');
                if (data) {
                    const parsed = JSON.parse(data);
                    this.people = parsed.people || [];
                    this.events = parsed.events || [];
                    this.gifts = parsed.gifts || [];
                } else {
                    this.loadDemo();
                }
            } catch(e) {
                this.loadDemo();
            }
        },
        
        save() {
            localStorage.setItem('gifttracker_pro', JSON.stringify({
                people: this.people,
                events: this.events,
                gifts: this.gifts
            }));
        },
        
        loadDemo() {
            this.people = [
                {id: '1', name: 'Мама', birthday: '1975-03-15', relationship: 'Родственник', notes: 'Любит цветы'},
                {id: '2', name: 'Папа', birthday: '1970-07-22', relationship: 'Родственник', notes: 'Увлекается рыбалкой'},
                {id: '3', name: 'Анна', birthday: '1995-11-08', relationship: 'Друг', notes: 'Любит книги'},
                {id: '4', name: 'Дима', birthday: '1992-01-30', relationship: 'Коллега', notes: 'Геймер'}
            ];
            this.events = [
                {id: '1', title: 'День рождения Мамы', date: '2026-03-15', type: 'birthday', budget: 100, personId: '1'},
                {id: '2', title: 'Новый год', date: '2026-12-31', type: 'holiday', budget: 200},
                {id: '3', title: '8 марта', date: '2026-03-08', type: 'holiday', budget: 150}
            ];
            this.gifts = [
                {id: '1', name: 'Букет цветов', price: 50, status: 'planned', eventId: '1', store: 'Цветочный'},
                {id: '2', name: 'Парфюм', price: 80, status: 'bought', eventId: '1', store: 'Летуаль'}
            ];
            this.save();
        },
        
        addPerson(p) {
            p.id = Date.now().toString();
            this.people.push(p);
            this.save();
        },
        
        addEvent(e) {
            e.id = Date.now().toString();
            this.events.push(e);
            this.save();
        },
        
        addGift(g) {
            g.id = Date.now().toString();
            this.gifts.push(g);
            this.save();
        },
        
        getUpcomingBirthdays(days = 30) {
            const now = new Date();
            return this.people.filter(p => p.birthday).map(p => {
                const bday = new Date(p.birthday);
                const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
                if (next < now) next.setFullYear(now.getFullYear() + 1);
                const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
                return {...p, daysUntil: diff};
            }).filter(p => p.daysUntil >= 0 && p.daysUntil <= days).sort((a, b) => a.daysUntil - b.daysUntil);
        },
        
        getUpcomingEvents(days = 30) {
            const now = new Date();
            return this.events.map(e => {
                const d = new Date(e.date);
                const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                return {...e, daysUntil: diff};
            }).filter(e => e.daysUntil >= 0 && e.daysUntil <= days).sort((a, b) => a.daysUntil - b.daysUntil);
        },
        
        getGiftsForEvent(eventId) {
            return this.gifts.filter(g => g.eventId === eventId);
        },
        
        getStats() {
            const totalBudget = this.events.reduce((s, e) => s + (parseFloat(e.budget) || 0), 0);
            const totalSpent = this.gifts.reduce((s, g) => s + (parseFloat(g.price) || 0), 0);
            return {totalBudget, totalSpent, remaining: totalBudget - totalSpent, people: this.people.length, events: this.events.length, gifts: this.gifts.length};
        }
    };

    // Icons
    const icons = {
        birthday: '🎂', anniversary: '❤️', holiday: '⭐', other: '🎁',
        planned: '○', bought: '✓', wrapped: '🎁', given: '✅'
    };
    
    const colors = {
        birthday: '#FF2D55', anniversary: '#FF3B30', holiday: '#FF9500', other: '#007AFF',
        planned: '#8E8E93', bought: '#007AFF', wrapped: '#FF9500', given: '#34C759'
    };

    // State
    let currentTab = 'home';
    let currentView = 'home';

    // Initialize
    function init() {
        store.load();
        
        // Setup tab handlers
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        // Setup nav back
        document.getElementById('nav-back').addEventListener('click', goBack);
        
        // Setup nav action
        document.getElementById('nav-action').addEventListener('click', showAddMenu);
        
        // Hide splash
        setTimeout(() => {
            document.getElementById('splash').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            renderHome();
        }, 2000);
    }

    // Tab Switching
    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        switch(tab) {
            case 'home': renderHome(); break;
            case 'people': renderPeople(); break;
            case 'events': renderEvents(); break;
            case 'stats': renderStats(); break;
        }
    }

    // Navigation
    function goBack() {
        currentView = 'home';
        document.getElementById('nav-back').classList.remove('visible');
        document.getElementById('nav-title').textContent = 'GiftTracker';
        renderHome();
    }

    function showAddMenu() {
        const menu = document.createElement('div');
        menu.className = 'modal-menu';
        menu.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-item" onclick="renderAddPerson(); this.closest('.modal-menu').remove()">
                    <span>👤</span> Добавить человека
                </button>
                <button class="modal-item" onclick="renderAddEvent(); this.closest('.modal-menu').remove()">
                    <span>📅</span> Добавить событие
                </button>
            </div>
        `;
        document.body.appendChild(menu);
    }

    // Render Home
    function renderHome() {
        currentView = 'home';
        const stats = store.getStats();
        const birthdays = store.getUpcomingBirthdays();
        const events = store.getUpcomingEvents();
        
        let html = '<div class="animate-fade-in">';
        
        // Welcome
        html += '<div class="section-header">Привет! 🎉</div>';
        html += '<div class="section-subtitle">Вот что происходит сейчас</div>';
        
        // Birthdays
        if (birthdays.length > 0) {
            html += '<div class="section-header" style="font-size:20px">🎂 Ближайшие дни рождения</div>';
            html += '<div class="horizontal-scroll">';
            birthdays.slice(0, 5).forEach(p => {
                html += `<div class="birthday-card" onclick="renderPersonDetail('${p.id}')">`;
                html += '<div class="birthday-card-header">';
                html += '<div class="birthday-card-avatar">👤</div>';
                html += `<span class="birthday-card-badge">${p.daysUntil === 0 ? 'Сегодня!' : p.daysUntil + ' дн.'}</span>`;
                html += '</div>';
                html += `<div class="birthday-card-name">${p.name}</div>`;
                html += '</div>';
            });
            html += '</div>';
        }
        
        // Events
        if (events.length > 0) {
            html += '<div class="section-header" style="font-size:20px">🎁 Ближайшие события</div>';
            events.slice(0, 5).forEach(e => {
                html += `<div class="card" style="margin-bottom:8px;cursor:pointer" onclick="renderEventDetail('${e.id}')">`;
                html += '<div class="card-row">';
                html += `<div class="card-icon" style="background:${colors[e.type]}20;color:${colors[e.type]}">${icons[e.type]}</div>`;
                html += '<div class="card-content">';
                html += `<div class="card-title">${e.title}</div>`;
                html += `<div class="card-subtitle">${formatDate(e.date)} · ${e.daysUntil} дн.</div>`;
                html += '</div>';
                if (e.budget > 0) html += `<div class="card-value">${e.budget} USD</div>`;
                html += '</div></div>';
            });
        }
        
        // Quick Actions
        html += '<div class="section-header" style="font-size:20px">⚡ Быстрые действия</div>';
        html += '<div class="quick-actions">';
        html += '<div class="action-button" onclick="renderAddPerson()">';
        html += '<div class="action-button-icon">👤</div>';
        html += '<div class="action-button-label">Добавить</div>';
        html += '</div>';
        html += '<div class="action-button" onclick="renderAddEvent()">';
        html += '<div class="action-button-icon">📅</div>';
        html += '<div class="action-button-label">Событие</div>';
        html += '</div>';
        html += '</div>';
        
        // Stats
        html += '<div class="section-header" style="font-size:20px">📊 Статистика</div>';
        html += '<div class="stats-grid">';
        html += `<div class="stat-card"><div class="stat-label">Бюджет</div><div class="stat-value blue">${stats.totalBudget} USD</div></div>`;
        html += `<div class="stat-card"><div class="stat-label">Потрачено</div><div class="stat-value green">${stats.totalSpent} USD</div></div>`;
        html += '</div>';
        
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render People
    function renderPeople() {
        currentView = 'people';
        let html = '<div class="animate-fade-in">';
        html += '<div class="section-header">Люди</div>';
        html += '<div class="search-bar"><div class="search-bar-inner"><span class="search-bar-icon">🔍</span><input type="text" class="search-bar-input" placeholder="Поиск" oninput="filterPeople(this.value)"></div></div>';
        
        if (store.people.length > 0) {
            html += '<div id="people-list">';
            store.people.forEach(p => {
                const age = p.birthday ? new Date().getFullYear() - new Date(p.birthday).getFullYear() : null;
                html += `<div class="card" style="margin-bottom:1px;cursor:pointer" onclick="renderPersonDetail('${p.id}')">`;
                html += '<div class="card-row">';
                html += '<div class="card-icon" style="background:#FF2D5520;color:#FF2D55;font-size:20px">👤</div>';
                html += '<div class="card-content">';
                html += `<div class="card-title">${p.name}</div>`;
                if (p.relationship) html += `<div class="card-subtitle">${p.relationship}</div>`;
                html += '</div>';
                if (age) html += `<div class="card-value">${age} лет</div>`;
                html += '</div></div>';
            });
            html += '</div>';
        } else {
            html += '<div class="empty-state">';
            html += '<div class="empty-state-icon">👤</div>';
            html += '<div class="empty-state-title">Нет людей</div>';
            html += '<div class="empty-state-subtitle">Добавьте близких</div>';
            html += '<button class="btn btn-primary" style="margin-top:16px" onclick="renderAddPerson()">Добавить</button>';
            html += '</div>';
        }
        
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render Events
    function renderEvents() {
        currentView = 'events';
        let html = '<div class="animate-fade-in">';
        html += '<div class="section-header">События</div>';
        
        if (store.events.length > 0) {
            store.events.forEach(e => {
                const d = new Date(e.date);
                const now = new Date();
                const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                html += `<div class="card" style="margin-bottom:1px;cursor:pointer" onclick="renderEventDetail('${e.id}')">`;
                html += '<div class="card-row">';
                html += `<div class="card-icon" style="background:${colors[e.type]}20;color:${colors[e.type]}">${icons[e.type]}</div>`;
                html += '<div class="card-content">';
                html += `<div class="card-title">${e.title}</div>`;
                html += `<div class="card-subtitle">${formatDate(e.date)} ${diff >= 0 ? '· ' + diff + ' дн.' : ''}</div>`;
                html += '</div>';
                if (e.budget > 0) html += `<div class="card-value">${e.budget} USD</div>`;
                html += '</div></div>';
            });
        } else {
            html += '<div class="empty-state">';
            html += '<div class="empty-state-icon">📅</div>';
            html += '<div class="empty-state-title">Нет событий</div>';
            html += '<button class="btn btn-primary" style="margin-top:16px" onclick="renderAddEvent()">Добавить</button>';
            html += '</div>';
        }
        
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render Stats
    function renderStats() {
        currentView = 'stats';
        const stats = store.getStats();
        
        let html = '<div class="animate-fade-in">';
        html += '<div class="section-header">Статистика</div>';
        
        html += '<div class="stats-grid">';
        html += `<div class="stat-card"><div class="stat-label">Бюджет</div><div class="stat-value blue">${stats.totalBudget} USD</div></div>`;
        html += `<div class="stat-card"><div class="stat-label">Потрачено</div><div class="stat-value green">${stats.totalSpent} USD</div></div>`;
        html += '</div>';
        
        html += '<div class="card" style="margin-top:16px">';
        html += '<div style="padding:16px">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:12px">';
        html += `<div><div class="stat-label">Общий бюджет</div><div style="font-size:20px;font-weight:700">${stats.totalBudget} USD</div></div>`;
        html += `<div style="text-align:right"><div class="stat-label">Осталось</div><div style="font-size:20px;font-weight:700;color:${stats.remaining >= 0 ? '#34C759' : '#FF3B30'}">${stats.remaining} USD</div></div>`;
        html += '</div>';
        html += `<div class="progress-bar"><div class="progress-bar-fill ${stats.remaining >= 0 ? 'green' : 'red'}" style="width:${Math.min((stats.totalSpent/stats.totalBudget)*100,100)}%"></div></div>`;
        html += '</div></div>';
        
        html += '<div class="card" style="margin-top:16px">';
        html += `<div class="card-row"><span style="font-size:20px">👥</span><div class="card-content"><div class="card-title">Людей</div></div><div class="card-value">${stats.people}</div></div>`;
        html += `<div class="card-row"><span style="font-size:20px">🎁</span><div class="card-content"><div class="card-title">Событий</div></div><div class="card-value">${stats.events}</div></div>`;
        html += `<div class="card-row"><span style="font-size:20px">🎀</span><div class="card-content"><div class="card-title">Подарков</div></div><div class="card-value">${stats.gifts}</div></div>`;
        html += '</div>';
        
        html += '<div class="section-header" style="font-size:20px">💡 Советы</div>';
        html += '<div class="card"><div class="card-row"><span style="font-size:24px">📅</span><div class="card-content"><div class="card-title">Планируйте заранее</div><div class="card-subtitle">Покупайте подарки заранее</div></div></div></div>';
        html += '<div class="card" style="margin-top:8px"><div class="card-row"><span style="font-size:24px">💰</span><div class="card-content"><div class="card-title">Следите за бюджетом</div><div class="card-subtitle">Устанавливайте лимит на каждое событие</div></div></div></div>';
        
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render Person Detail
    function renderPersonDetail(id) {
        currentView = 'personDetail';
        const p = store.people.find(x => x.id === id);
        if (!p) return renderPeople();
        
        const age = p.birthday ? new Date().getFullYear() - new Date(p.birthday).getFullYear() : null;
        
        document.getElementById('nav-back').classList.add('visible');
        document.getElementById('nav-title').textContent = p.name;
        
        let html = '<div class="animate-fade-in">';
        html += '<div style="text-align:center;padding:32px 16px">';
        html += '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#FF2D55,#FF6B8A);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:40px">👤</div>';
        html += `<div style="font-size:24px;font-weight:700">${p.name}</div>`;
        if (p.relationship) html += `<div style="color:var(--ios-label-secondary)">${p.relationship}</div>`;
        html += '</div>';
        
        html += '<div class="card" style="margin-bottom:16px">';
        if (p.birthday) {
            html += `<div class="card-row"><span style="font-size:20px">🎂</span><div class="card-content"><div class="card-title">День рождения</div><div class="card-subtitle">${formatDate(p.birthday)}</div></div></div>`;
        }
        if (age) {
            html += `<div class="card-row"><span style="font-size:20px">📱</span><div class="card-content"><div class="card-title">Возраст</div><div class="card-subtitle">${age} лет</div></div></div>`;
        }
        if (p.notes) {
            html += `<div class="card-row"><span style="font-size:20px">📝</span><div class="card-content"><div class="card-title">Заметки</div><div class="card-subtitle">${p.notes}</div></div></div>`;
        }
        html += '</div>';
        
        html += '<button class="btn btn-primary btn-full" onclick="renderAddEvent()">Добавить событие</button>';
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render Event Detail
    function renderEventDetail(id) {
        currentView = 'eventDetail';
        const e = store.events.find(x => x.id === id);
        if (!e) return renderEvents();
        
        const gifts = store.getGiftsForEvent(id);
        const spent = gifts.reduce((s, g) => s + (parseFloat(g.price) || 0), 0);
        const remaining = (parseFloat(e.budget) || 0) - spent;
        
        document.getElementById('nav-back').classList.add('visible');
        document.getElementById('nav-title').textContent = e.title;
        
        let html = '<div class="animate-fade-in">';
        html += '<div style="text-align:center;padding:32px 16px">';
        html += `<div style="font-size:60px;margin-bottom:12px">${icons[e.type]}</div>`;
        html += `<div style="font-size:24px;font-weight:700;margin-bottom:4px">${e.title}</div>`;
        html += `<div style="color:var(--ios-label-secondary)">${formatDate(e.date)}</div>`;
        html += '</div>';
        
        if (e.budget > 0) {
            html += '<div class="card" style="margin-bottom:16px">';
            html += '<div style="padding:16px">';
            html += '<div style="display:flex;justify-content:space-between;margin-bottom:12px">';
            html += `<div><div class="stat-label">Бюджет</div><div style="font-size:20px;font-weight:700">${e.budget} USD</div></div>`;
            html += `<div style="text-align:right"><div class="stat-label">Потрачено</div><div style="font-size:20px;font-weight:700;color:${remaining >= 0 ? '#34C759' : '#FF3B30'}">${spent} USD</div></div>`;
            html += '</div>';
            html += `<div class="progress-bar"><div class="progress-bar-fill ${remaining >= 0 ? 'green' : 'red'}" style="width:${Math.min((spent/e.budget)*100,100)}%"></div></div>`;
            html += '</div></div>';
        }
        
        html += '<div style="margin-bottom:16px">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0 16px;margin-bottom:12px">';
        html += '<div style="font-size:20px;font-weight:600">🎁 Подарки</div>';
        html += `<button style="background:none;border:none;color:#007AFF;font-size:15px;cursor:pointer" onclick="showAddGift('${e.id}')">+ Добавить</button>`;
        html += '</div>';
        
        if (gifts.length > 0) {
            gifts.forEach(g => {
                html += '<div class="card" style="margin-bottom:1px">';
                html += '<div class="card-row">';
                html += `<div class="card-icon" style="background:${colors[g.status]}20;color:${colors[g.status]}">${icons[g.status]}</div>`;
                html += '<div class="card-content">';
                html += `<div class="card-title">${g.name}</div>`;
                html += `<div class="card-subtitle">${g.store || ''} · ${g.status}</div>`;
                html += '</div>';
                if (g.price > 0) html += `<div class="card-value">${g.price} USD</div>`;
                html += '</div></div>';
            });
        } else {
            html += '<div class="empty-state" style="padding:32px">';
            html += '<div class="empty-state-icon" style="font-size:48px">🎁</div>';
            html += '<div class="empty-state-subtitle">Нет подарков</div>';
            html += '</div>';
        }
        
        html += '</div></div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Render Add Person
    function renderAddPerson() {
        currentView = 'addPerson';
        document.getElementById('nav-back').classList.add('visible');
        document.getElementById('nav-title').textContent = 'Новый человек';
        
        let html = '<div class="animate-fade-in">';
        html += '<div class="form-group">';
        html += '<div class="form-row"><label class="form-label">Имя</label><input type="text" class="form-input" id="p-name" placeholder="Введите имя"></div>';
        html += '<div class="form-row"><label class="form-label">День Р</label><input type="date" class="form-input" id="p-bday" style="text-align:right"></div>';
        html += '<div class="form-row"><label class="form-label">Отношения</label><input type="text" class="form-input" id="p-rel" placeholder="Друг, родственник"></div>';
        html += '</div>';
        
        html += '<div class="form-group"><div class="form-row" style="align-items:flex-start"><label class="form-label" style="padding-top:12px">Заметки</label><textarea class="form-input" id="p-notes" rows="3" style="text-align:left;resize:none"></textarea></div></div>';
        
        html += '<button class="btn btn-primary btn-full" style="margin-top:20px" onclick="savePerson()">Сохранить</button>';
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Save Person
    function savePerson() {
        const name = document.getElementById('p-name').value;
        if (!name) { alert('Введите имя'); return; }
        store.addPerson({
            name,
            birthday: document.getElementById('p-bday').value,
            relationship: document.getElementById('p-rel').value,
            notes: document.getElementById('p-notes').value
        });
        goBack();
    }

    // Render Add Event
    function renderAddEvent() {
        currentView = 'addEvent';
        document.getElementById('nav-back').classList.add('visible');
        document.getElementById('nav-title').textContent = 'Новое событие';
        
        let html = '<div class="animate-fade-in">';
        html += '<div class="form-group">';
        html += '<div class="form-row"><label class="form-label">Название</label><input type="text" class="form-input" id="e-title" placeholder="День рождения..."></div>';
        html += '<div class="form-row"><label class="form-label">Дата</label><input type="date" class="form-input" id="e-date" style="text-align:right"></div>';
        html += '<div class="form-row"><label class="form-label">Тип</label><select class="form-input" id="e-type" style="text-align:right;border:none;background:none"><option value="birthday">День рождения</option><option value="anniversary">Годовщина</option><option value="holiday">Праздник</option><option value="other">Другое</option></select></div>';
        html += '<div class="form-row"><label class="form-label">Бюджет</label><input type="number" class="form-input" id="e-budget" placeholder="0" style="text-align:right"></div>';
        html += '</div>';
        
        html += '<button class="btn btn-primary btn-full" style="margin-top:20px" onclick="saveEvent()">Сохранить</button>';
        html += '</div>';
        document.getElementById('content-area').innerHTML = html;
    }

    // Save Event
    function saveEvent() {
        const title = document.getElementById('e-title').value;
        const date = document.getElementById('e-date').value;
        if (!title || !date) { alert('Заполните название и дату'); return; }
        store.addEvent({
            title,
            date,
            type: document.getElementById('e-type').value,
            budget: parseFloat(document.getElementById('e-budget').value) || 0
        });
        goBack();
    }

    // Show Add Gift
    function showAddGift(eventId) {
        const name = prompt('Название подарка:');
        if (!name) return;
        const price = parseFloat(prompt('Цена (USD):') || 0);
        store.addGift({name, price, status: 'planned', eventId});
        renderEventDetail(eventId);
    }

    // Filter People
    function filterPeople(query) {
        const items = document.querySelectorAll('#people-list > div');
        items.forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    // Format Date
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
    }

    // Expose functions globally
    window.switchTab = switchTab;
    window.renderPersonDetail = renderPersonDetail;
    window.renderEventDetail = renderEventDetail;
    window.renderAddPerson = renderAddPerson;
    window.renderAddEvent = renderAddEvent;
    window.savePerson = savePerson;
    window.saveEvent = saveEvent;
    window.showAddGift = showAddGift;
    window.filterPeople = filterPeople;
    window.goBack = goBack;

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
