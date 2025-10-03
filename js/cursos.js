document.addEventListener('DOMContentLoaded', () => {
    const asyncSection = document.querySelector('[data-section="async"]');
    const onlineSection = document.querySelector('[data-section="online"]');
    const asyncCourses = document.querySelector('.async-courses');
    const onlineCourses = document.querySelector('.online-courses');
    let currentDate = new Date();
    const monthYear = document.querySelector('.month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonth = document.querySelector('.prev-month');
    const nextMonth = document.querySelector('.next-month');

    function updateCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        for (let i = 0; i < startingDay; i++) {
            const emptyDiv = document.createElement('div');
            calendarGrid.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.innerHTML = `<span>${day}</span><input type="text" placeholder="Clase...">`;
            calendarGrid.appendChild(dayDiv);
        }
    }

    asyncSection.addEventListener('click', () => {
        asyncCourses.style.display = 'block';
        onlineCourses.style.display = 'none';
        asyncSection.style.backgroundColor = '#facd32';
        onlineSection.style.backgroundColor = '#fff';
    });

    onlineSection.addEventListener('click', () => {
        asyncCourses.style.display = 'none';
        onlineCourses.style.display = 'block';
        onlineCourses.classList.add('active');
        updateCalendar();
        asyncSection.style.backgroundColor = '#fff';
        onlineSection.style.backgroundColor = '#facd32';
    });

    prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    // Initial state
    asyncCourses.style.display = 'block';
    onlineCourses.style.display = 'none';
    asyncSection.style.backgroundColor = '#facd32';
    onlineSection.style.backgroundColor = '#fff';
});