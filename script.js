document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const calendarContent = document.getElementById('calendar-content');
    const calendarWeekdays = document.getElementById('calendar-weekdays');
    const datePillDay = document.querySelector('#date-pill .day-number');
    const datePillMonth = document.querySelector('#date-pill .month-abbr'); // Corrected selector based on HTML
    const dateRangeMonthYear = document.querySelector('#date-range strong');
    const dateRangeFull = document.querySelector('#date-range span');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const todayBtn = document.getElementById('today-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const eventForm = document.getElementById('event-form');
    const eventFilters = document.getElementById('event-filters');
    const searchInput = document.getElementById('search-input');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const viewSelector = document.getElementById('view-selector');

    // --- State ---
    let currentDate = new Date(); // Anchor for the current view
    let selectedDate = new Date(); // Highlighted/focused date
    let currentView = 'month';
    let currentFilter = 'all';
    let currentSearchTerm = '';
    // Load events from localStorage or use sample data
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || [
        { id: 1, date: formatDate(addDays(new Date(), -5)), title: 'Past Project Deadline', time: '17:00', type: 'pink' },
        { id: 2, date: formatDate(new Date()), title: 'Stand Up Meeting', time: '09:00', type: 'blu' },
        { id: 3, date: formatDate(new Date()), title: 'Client Call', time: '14:30', type: 'green' },
        { id: 4, date: formatDate(addDays(new Date(), 1)), title: 'Code Review', time: '11:00', type: 'purple' },
        { id: 5, date: formatDate(addDays(new Date(), 3)), title: 'Team Lunch', time: '12:30', type: 'oran' },
        { id: 6, date: formatDate(addDays(new Date(), 3)), title: 'Planning Session', time: null, type: 'black' }, // All day
    ];

    // --- Date Utils ---
    function formatDate(date) { const d = new Date(date); const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }
    function formatTime12hr(time24) { if (!time24) return ''; try { const [hours, minutes] = time24.split(':'); const h = parseInt(hours, 10); const suffix = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${minutes} ${suffix}`; } catch (e) { return time24; } }
    function getWeekStart(date) { const d = new Date(date); d.setHours(0,0,0,0); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); }
    function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
    function areDatesEqual(date1, date2) { return formatDate(date1) === formatDate(date2); }

    // --- Local Storage ---
    function saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }

    // --- Event Element Creator ---
    function createEventElement(event) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('event-block-wrapper');

        const eventP = document.createElement('p');
        eventP.classList.add('event-block', event.type || 'black');
        eventP.dataset.eventId = event.id;
        const time12h = formatTime12hr(event.time);
        // Use the dot structure from your CSS if needed, or keep simple text
        // eventP.innerHTML = `<span class="dot"><img src="data:image/svg+xml;..." alt="dot"></span> ${event.title} ${time12h}`.trim();
        eventP.textContent = `${event.title} ${time12h}`.trim(); // Simpler text content
        eventP.title = `${event.title}${time12h ? ` at ${time12h}` : ''}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-event-btn');
        deleteBtn.dataset.eventId = event.id;
        deleteBtn.setAttribute('aria-label', 'Delete event');
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" fill="currentColor"><path fill-rule="evenodd" d="M1.414 0L4 2.586 6.586 0 8 1.414 5.414 4 8 6.586 6.586 8 4 5.414 1.414 8 0 6.586 2.586 4 0 1.414z" clip-rule="evenodd"/></svg>`;

        wrapper.appendChild(eventP);
        wrapper.appendChild(deleteBtn);
        return wrapper;
    }

    // --- Rendering Functions ---
    function renderCalendarHeader() {
        if (!datePillDay || !datePillMonth || !dateRangeMonthYear || !dateRangeFull) {
             console.error("Header elements not found!"); return;
        }
        datePillDay.textContent = selectedDate.getDate();
        datePillMonth.textContent = selectedDate.toLocaleDateString('en-US', { month: 'short' });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const longDateFormat = { month: 'long', day: 'numeric', year: 'numeric' };

        if (currentView === 'month') {
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            dateRangeMonthYear.textContent = `${monthName} ${year}`;
            dateRangeFull.textContent = `${firstDayOfMonth.toLocaleDateString('en-US', longDateFormat)} - ${lastDayOfMonth.toLocaleDateString('en-US', longDateFormat)}`;
        } else if (currentView === 'week') {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = addDays(weekStart, 6);
            const startMonthName = weekStart.toLocaleDateString('en-US', { month: 'long' });
            const endMonthName = weekEnd.toLocaleDateString('en-US', { month: 'long' });
            dateRangeMonthYear.textContent = startMonthName === endMonthName ?
                `${startMonthName} ${weekStart.getFullYear()}` :
                `${startMonthName.substring(0,3)} ${weekStart.getDate()} - ${endMonthName.substring(0,3)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
            dateRangeFull.textContent = `${weekStart.toLocaleDateString('en-US', longDateFormat)} - ${weekEnd.toLocaleDateString('en-US', longDateFormat)}`;
        } else if (currentView === 'day') {
            dateRangeMonthYear.textContent = selectedDate.toLocaleDateString('en-US', longDateFormat);
            dateRangeFull.textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        }
    }

    function renderMonthView() {
        calendarContent.innerHTML = '';
        calendarContent.className = 'calendar-content calendar-dates'; // Match HTML/CSS class
        calendarWeekdays.style.display = 'grid';
        calendarWeekdays.innerHTML = '<div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>';

        const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const today = new Date();
        const firstDayOfMonth = new Date(year, month, 1); const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; const lastDayPrevMonthDate = new Date(year, month, 0);
        const totalDays = lastDayOfMonth.getDate(); const totalCells = Math.ceil((firstDayWeekday + totalDays) / 7) * 7;
        let date = 1; let nextMonthDate = 1;

        for (let i = 0; i < totalCells; i++) {
            // Use div for cell as in your CSS/HTML
            const cell = document.createElement('div');
            // cell.classList.add('date-cell'); // This class seems unused in your style.css, using direct children selector
            if (i >= totalCells - 7) cell.classList.add('last-row'); // Add class if needed by CSS

            // Use .no based on your CSS
            const dateNumberSpan = document.createElement('span');
            dateNumberSpan.classList.add('no'); // Class from your CSS

            const eventsListDiv = document.createElement('div');
            eventsListDiv.classList.add('text'); // Class from your CSS for events container
            let cellDate = null; let isCurrentMonth = false;

            if (i < firstDayWeekday) { const day = lastDayPrevMonthDate.getDate() - firstDayWeekday + i + 1; dateNumberSpan.textContent = day; cell.classList.add('other-month'); cellDate = new Date(year, month - 1, day); }
            else if (date <= totalDays) { dateNumberSpan.textContent = date; isCurrentMonth = true; cellDate = new Date(year, month, date); if (areDatesEqual(today, cellDate)) { cell.classList.add('today'); dateNumberSpan.classList.add('no1'); } /* Add class for today number */ if (areDatesEqual(selectedDate, cellDate)) cell.classList.add('selected'); date++; }
            else { dateNumberSpan.textContent = nextMonthDate; cell.classList.add('other-month'); cellDate = new Date(year, month + 1, nextMonthDate); nextMonthDate++; }

            const cellDateStr = formatDate(cellDate); cell.dataset.date = cellDateStr; if (!isCurrentMonth) cell.dataset.isOtherMonth = true;

            const dayEvents = events.filter(event => event.date === cellDateStr && (!currentSearchTerm || event.title.toLowerCase().includes(currentSearchTerm.toLowerCase()))).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            const maxEventsToShow = 3;
            dayEvents.slice(0, maxEventsToShow).forEach(event => eventsListDiv.appendChild(createEventElement(event)));
            if (dayEvents.length > maxEventsToShow) { const moreP = document.createElement('p'); moreP.classList.add('more'); moreP.textContent = `${dayEvents.length - maxEventsToShow} more...`; eventsListDiv.appendChild(moreP); }

            cell.appendChild(dateNumberSpan); cell.appendChild(eventsListDiv); calendarContent.appendChild(cell);
        }
    }

    function renderWeekView() {
        calendarContent.innerHTML = '';
        calendarContent.className = 'calendar-content week-view-content'; // Set specific class if needed by CSS
        calendarWeekdays.style.display = 'grid';
        calendarWeekdays.innerHTML = '';

        const weekStart = getWeekStart(currentDate); const today = new Date();

        for (let i = 0; i < 7; i++) {
            const dayDate = addDays(weekStart, i); const cellDateStr = formatDate(dayDate);

            // Create structure matching month view cell if needed by CSS or make specific week view structure
             const weekdayHeader = document.createElement('div');
             weekdayHeader.innerHTML = `<span class="day-name">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>`;
             calendarWeekdays.appendChild(weekdayHeader);


            const column = document.createElement('div'); // Use div as the main column container
            // column.classList.add('week-day-column'); // Add specific class if needed
            column.dataset.date = cellDateStr;
            if (areDatesEqual(today, dayDate)) column.classList.add('today');
            if (areDatesEqual(selectedDate, dayDate)) column.classList.add('selected');

             // Add header for the day number (similar to month view cell structure)
            const headerDiv = document.createElement('div');
            // headerDiv.classList.add('week-day-header'); // Add class if needed
            const dateNumberSpan = document.createElement('span');
            dateNumberSpan.classList.add('no'); // Use class from your CSS
            if (areDatesEqual(today, dayDate)) dateNumberSpan.classList.add('no1');
            dateNumberSpan.textContent = dayDate.getDate();
            headerDiv.appendChild(dateNumberSpan);
            column.appendChild(headerDiv);


            const eventsListDiv = document.createElement('div');
            eventsListDiv.classList.add('text'); // Use class from your CSS
            // eventsListDiv.classList.add('events-list'); // Add scroll etc. if needed

            const dayEvents = events.filter(event => event.date === cellDateStr && (!currentSearchTerm || event.title.toLowerCase().includes(currentSearchTerm.toLowerCase()))).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            dayEvents.forEach(event => eventsListDiv.appendChild(createEventElement(event))); // Use creator

            column.appendChild(eventsListDiv);
            calendarContent.appendChild(column);
        }
    }

    function renderDayView() {
        calendarContent.innerHTML = '';
        calendarContent.className = 'calendar-content day-view-content'; // Use specific class for styling
        calendarWeekdays.style.display = 'none';

        const selectedStr = formatDate(selectedDate);
        const dayTitle = document.createElement('h2');
        dayTitle.classList.add('day-title'); // Add class if needed by CSS
        dayTitle.textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        calendarContent.appendChild(dayTitle);

        const eventListDiv = document.createElement('div');
        eventListDiv.classList.add('event-list'); // Add class if needed by CSS

        const dayEvents = events.filter(event => event.date === selectedStr && (!currentSearchTerm || event.title.toLowerCase().includes(currentSearchTerm.toLowerCase()))).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        if (dayEvents.length === 0) {
            const noEvents = document.createElement('p');
            noEvents.classList.add('no-events'); // Add class if needed by CSS
            noEvents.textContent = 'No events scheduled for this day.';
            eventListDiv.appendChild(noEvents);
        } else {
            dayEvents.forEach(event => {
                const item = document.createElement('div');
                // item.classList.add('day-event-item'); // Add class if needed by CSS
                const timeSpan = document.createElement('span');
                // timeSpan.classList.add('event-time'); // Add class if needed by CSS
                if (event.time) { timeSpan.textContent = formatTime12hr(event.time); } else { timeSpan.textContent = 'All day'; timeSpan.classList.add('all-day'); }
                const detailsDiv = document.createElement('div');
                // detailsDiv.classList.add('event-details'); // Add class if needed by CSS
                detailsDiv.appendChild(createEventElement(event));
                item.appendChild(timeSpan); item.appendChild(detailsDiv); eventListDiv.appendChild(item);
            });
        }
        calendarContent.appendChild(eventListDiv);
    }

    function renderApp() { /* ... keep previous ... */ try { renderCalendarHeader(); calendarWeekdays.style.display = (currentView === 'month' || currentView === 'week') ? 'grid' : 'none'; if (currentView === 'month') renderMonthView(); else if (currentView === 'week') renderWeekView(); else if (currentView === 'day') renderDayView(); } catch (error) { console.error("Error rendering view:", currentView, error); calendarContent.innerHTML = `<p style="color: red; padding: 20px;">Error rendering calendar view. Please check console.</p>`; } }

    // --- Event Modal Functions ---
    function showModal(dateStr = '') { eventForm.reset(); const targetDate = dateStr || formatDate(selectedDate); document.getElementById('event-date').value = targetDate; eventModal.style.display = 'flex'; /* Use style.display */ eventModal.classList.add('visible'); document.getElementById('event-title').focus(); };
    function hideModal() { eventModal.classList.remove('visible'); eventModal.style.display = 'none'; }; /* Use style.display */
    function addEvent(e) { e.preventDefault(); const formData = new FormData(eventForm); const newEvent = { id: Date.now(), date: formData.get('date'), title: formData.get('title').trim(), time: formData.get('time') || null, type: formData.get('type') }; if (!newEvent.title || !newEvent.date) { alert("Event title and date are required."); return; } events.push(newEvent); saveEvents(); hideModal(); renderApp(); };

     // --- Delete Event Function ---
     function deleteEvent(eventId) { const eventToDelete = events.find(ev => ev.id === eventId); if (!eventToDelete) return; if (window.confirm(`Are you sure you want to delete "${eventToDelete.title}"?`)) { events = events.filter(ev => ev.id !== eventId); saveEvents(); console.log(`Event ${eventId} deleted.`); renderApp(); } }

    // --- Event Listeners ---
    prevBtn.addEventListener('click', () => { /* ... keep previous navigation logic ... */ if (currentView === 'month') { currentDate.setMonth(currentDate.getMonth() - 1); selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); } else if (currentView === 'week') { currentDate.setDate(currentDate.getDate() - 7); selectedDate = new Date(currentDate); } else if (currentView === 'day') { selectedDate.setDate(selectedDate.getDate() - 1); currentDate = new Date(selectedDate); } renderApp(); });
    nextBtn.addEventListener('click', () => { /* ... keep previous navigation logic ... */ if (currentView === 'month') { currentDate.setMonth(currentDate.getMonth() + 1); selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); } else if (currentView === 'week') { currentDate.setDate(currentDate.getDate() + 7); selectedDate = new Date(currentDate); } else if (currentView === 'day') { selectedDate.setDate(selectedDate.getDate() + 1); currentDate = new Date(selectedDate); } renderApp(); });
    todayBtn.addEventListener('click', () => { currentDate = new Date(); selectedDate = new Date(); renderApp(); });
    viewSelector.addEventListener('change', (e) => { currentView = e.target.value; currentDate = new Date(selectedDate); renderApp(); });

    // Main listener for calendar content
    calendarContent.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-event-btn');
        if (deleteButton) {
            e.stopPropagation();
            const eventIdToDelete = parseInt(deleteButton.dataset.eventId, 10);
            deleteEvent(eventIdToDelete);
            return;
        }

        // Use direct child selector for month view based on your CSS
        const targetCell = e.target.closest('.calendar-dates > div, .week-day-column');
        if (targetCell && !e.target.closest('.event-block-wrapper') && targetCell.dataset.date && !targetCell.classList.contains('other-month')) { // Check classList for other-month
            const [year, month, day] = targetCell.dataset.date.split('-').map(Number);
            selectedDate = new Date(year, month - 1, day);
            renderApp();
            return;
        }

        const eventWrapper = e.target.closest('.event-block-wrapper');
        if (eventWrapper && !deleteButton) {
            const eventBlock = eventWrapper.querySelector('.event-block');
            if (eventBlock && eventBlock.dataset.eventId) {
               console.log("Clicked event block ID:", eventBlock.dataset.eventId);
               e.stopPropagation();
            }
       }
    });


    // --- Other Listeners ---
    addEventBtn.addEventListener('click', () => showModal());
    cancelEventBtn.addEventListener('click', hideModal);
    eventForm.addEventListener('submit', addEvent);
    eventModal.addEventListener('click', (e) => { if (e.target === eventModal) hideModal(); });
    eventFilters.addEventListener('click', (e) => { if(e.target.tagName === 'BUTTON' && e.target.dataset.filter){ eventFilters.querySelectorAll('button').forEach(b=>b.classList.remove('active')); e.target.classList.add('active'); currentFilter=e.target.dataset.filter; renderApp();} });
    let searchTimeout;
    searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { currentSearchTerm = searchInput.value; renderApp(); }, 300); });
    // Basic Mobile Toggle (assuming ID exists and sidebar class is correct)
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('visible'); // Make sure your CSS has a .sidebar.visible rule for mobile
        });
         // Close sidebar on click outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('visible')) {
                if (!sidebar.contains(e.target) && !menuToggleBtn.contains(e.target)) {
                    sidebar.classList.remove('visible');
                }
            }
        });
    }


    // --- Initial Load ---
    renderApp(); // Initial render

}); // End DOMContentLoaded