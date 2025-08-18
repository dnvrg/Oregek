// Navigation configuration
const navItems = [
    { id: 'patients', icon: 'fas fa-users', label: 'Páciensek', active: true },
    { id: 'calendar', icon: 'fas fa-calendar-alt', label: 'Naptár' },
    { id: 'shopping', icon: 'fas fa-shopping-basket', label: 'Bevásárló Lista' },
    { id: 'documents', icon: 'fas fa-file-alt', label: 'Dokumentumok' },
    { id: 'notes', icon: 'fas fa-sticky-note', label: 'Jegyzetek' },
    { id: 'calculator', icon: 'fas fa-calculator', label: 'Kiszámoló' }
];

// Data storage
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let shoppingItems = JSON.parse(localStorage.getItem('shoppingItems')) || [];
let documents = JSON.parse(localStorage.getItem('documents')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let savedCalculations = JSON.parse(localStorage.getItem('savedCalculations')) || [];
let savedCalendarData = JSON.parse(localStorage.getItem('savedCalendarData')) || [];

// UI element references
let patientToEdit = null;
let isRenameMode = false;
let renameId = null;

// New global variable to track the date of the loaded calculation
let currentCalculationDate = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');

    try {
        // Load data from localStorage
        const storedPatients = localStorage.getItem('patients');
        const storedShoppingItems = localStorage.getItem('shoppingItems');
        const storedDocuments = localStorage.getItem('documents');
        const storedNotes = localStorage.getItem('notes');
        const storedCalculations = localStorage.getItem('savedCalculations');
        const storedCalendarData = localStorage.getItem('savedCalendarData');

        patients = storedPatients ? JSON.parse(storedPatients) : [];
        shoppingItems = storedShoppingItems ? JSON.parse(storedShoppingItems) : [];
        documents = storedDocuments ? JSON.parse(storedDocuments) : [];
        notes = storedNotes ? JSON.parse(storedNotes) : [];
        savedCalculations = storedCalculations ? JSON.parse(storedCalculations) : [];
        savedCalendarData = storedCalendarData ? JSON.parse(storedCalendarData) : [];

        console.log('Data loaded from storage:', { patients, shoppingItems, documents, notes, savedCalculations, savedCalendarData });

    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        patients = [];
        shoppingItems = [];
        documents = [];
        notes = [];
        savedCalculations = [];
        savedCalendarData = [];
    }

    // Initialize UI
    initializeNavigation();
    initializeModals();
    initializeEventListeners();

    // Render initial data
    renderPatients();
    renderShoppingList();
    renderDocuments();
    renderNotes();
    updatePatientSelects();
    initializeCalendar();
    generateCalendar();

    // Initialize calculator
    initializeCalculator();

    console.log('Application initialized successfully');
});

// Navigation Functions
function initializeNavigation() {
    const desktopNav = document.getElementById('desktopNavItems');
    const mobileNav = document.getElementById('mobileNavItems');

    navItems.forEach(item => {
        // Desktop navigation
        if (desktopNav) {
            const navItem = createNavItem(item, false);
            desktopNav.appendChild(navItem);
        }

        // Mobile navigation
        if (mobileNav) {
            const mobileNavItem = createNavItem(item, true);
            mobileNav.appendChild(mobileNavItem);
        }
    });
}

function createNavItem(item, isMobile) {
    const navItem = document.createElement('button');
    navItem.className = `nav-item ${item.active ? 'active' : ''}`;
    navItem.innerHTML = `
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
    `;

    navItem.addEventListener('click', () => {
        showTab(item.id);
        if (isMobile) {
            closeMobileMenu();
        }
    });

    return navItem;
}

function showTab(tabId) {
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Update active navigation with lilac highlighting
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the corresponding nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        const itemText = item.querySelector('span').textContent;
        const targetItem = navItems.find(nav => nav.id === tabId);
        if (targetItem && itemText === targetItem.label) {
            item.classList.add('active');
        }
    });

    // Tab-specific actions
    switch (tabId) {
        case 'calendar':
            generateCalendar();
            break;
        case 'shopping':
            renderShoppingList();
            break;
        case 'documents':
            renderDocuments();
            break;
        case 'notes':
            renderNotes();
            break;
        case 'calculator':
            updateAllCalculations();
            break;
    }
}

// Mobile Menu Functions
function initializeModals() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeDayDetailBtn = document.getElementById('closeDayDetailModal');
    const dayDetailModal = document.getElementById('dayDetailModal');


    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    if (closeMobileMenuBtn) {
        closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
    }
    
    if (closeDayDetailBtn) {
        closeDayDetailBtn.addEventListener('click', closeDayDetailModal);
    }
    
    if (dayDetailModal) {
        dayDetailModal.addEventListener('click', (e) => {
            if (e.target === dayDetailModal) {
                closeDayDetailModal();
            }
        });
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === mobileMenuOverlay) {
                closeMobileMenu();
            }
        });
    }

    // Patient Modal
    const patientModal = document.getElementById('patientModal');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', openPatientModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePatientModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closePatientModal);
    }

    if (patientModal) {
        patientModal.addEventListener('click', (e) => {
            if (e.target === patientModal) {
                closePatientModal();
            }
        });
    }
}

function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function openPatientModal() {
    patientToEdit = null;
    clearPatientForm();
    document.getElementById('modalTitle').textContent = 'Új páciens';
    document.getElementById('deletePatientBtn').classList.add('hidden');
    document.getElementById('patientModal').classList.add('show');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('show');
    clearPatientForm();
    patientToEdit = null;
}

// New Modal Functions
function openDayDetailModal(date) {
    const modal = document.getElementById('dayDetailModal');
    if (modal) {
        document.getElementById('dayDetailTitle').textContent = `${new Date(date).toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        renderDayDetails(date);
        modal.classList.add('show');
    }
}

function closeDayDetailModal() {
    const modal = document.getElementById('dayDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function renderDayDetails(date) {
    const container = document.getElementById('dayDetailsContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    const visits = getVisitsForDate(date);
    
    if (visits.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek látogatások ezen a napon.</div>';
    } else {
        visits.forEach(visit => {
            const patient = patients.find(p => p.name === visit.name);
            const patientColor = patient ? patient.color : '#8b5cf6';
            
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeftColor = patientColor;
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${visit.name}</div>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Időpont: ${visit.time}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }
}


// Event Listeners
function initializeEventListeners() {
    // Search inputs
    const patientSearchInput = document.getElementById('patientSearchInput');
    if (patientSearchInput) {
        patientSearchInput.addEventListener('input', (e) => {
            renderPatients(e.target.value);
        });
    }

    const shoppingSearchInput = document.getElementById('shoppingSearchInput');
    if (shoppingSearchInput) {
        shoppingSearchInput.addEventListener('input', (e) => {
            renderShoppingList(e.target.value);
        });
    }

    const documentsSearchInput = document.getElementById('documentsSearchInput');
    if (documentsSearchInput) {
        documentsSearchInput.addEventListener('input', (e) => {
            renderDocuments(e.target.value);
        });
    }

    const notesSearchInput = document.getElementById('notesSearchInput');
    if (notesSearchInput) {
        notesSearchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });
    }

    // Forms
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientSubmit);
    }

    const shoppingForm = document.getElementById('shoppingForm');
    if (shoppingForm) {
        shoppingForm.addEventListener('submit', handleShoppingSubmit);
    }

    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', handleDocumentSubmit);
    }

    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }

    // File upload
    const uploadFile = document.getElementById('uploadFile');
    if (uploadFile) {
        uploadFile.addEventListener('change', handleFileUpload);
    }

    // Delete patient button
    const deletePatientBtn = document.getElementById('deletePatientBtn');
    if (deletePatientBtn) {
        deletePatientBtn.addEventListener('click', () => {
            if (patientToEdit) {
                deletePatient(patientToEdit.id);
            }
        });
    }
}

// Patient Management
function handlePatientSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');

    if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        return;
    }

    const visitDays = [];
    const dayCheckboxes = document.querySelectorAll('#patientModal input[type="checkbox"]:checked');
    dayCheckboxes.forEach(checkbox => {
        visitDays.push(parseInt(checkbox.value));
    });

    const patientData = {
        id: patientToEdit ? patientToEdit.id : Date.now(),
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: document.getElementById('address').value.trim(),
        intercom: document.getElementById('intercom').value.trim(),
        taj: document.getElementById('taj').value.trim(),
        emergencyContact: document.getElementById('emergencyContact').value.trim(),
        emergencyPhone: document.getElementById('emergencyPhone').value.trim(),
        tasks: document.getElementById('tasks').value.trim(),
        color: document.getElementById('patientColor').value,
        visitDays: visitDays,
        createdDate: patientToEdit ? patientToEdit.createdDate : new Date().toISOString()
    };

    try {
        if (patientToEdit) {
            const patientIndex = patients.findIndex(p => p.id === patientToEdit.id);
            if (patientIndex !== -1) {
                patients[patientIndex] = patientData;
            }
        } else {
            patients.push(patientData);
        }

        localStorage.setItem('patients', JSON.stringify(patients));

        renderPatients();
        updatePatientSelects();
        generateCalendar();
        closePatientModal();

    } catch (error) {
        console.error('Error saving patient:', error);
    }
}

function renderPatients(searchQuery = '') {
    const container = document.getElementById('patientsList');
    if (!container) return;

    container.innerHTML = '';

    const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'hu'));

    const filteredPatients = sortedPatients.filter(patient => {
        const query = searchQuery.toLowerCase();
        return (
            patient.name.toLowerCase().includes(query) ||
            (patient.address && patient.address.toLowerCase().includes(query)) ||
            (patient.phone && patient.phone.toLowerCase().includes(query))
        );
    });

    if (filteredPatients.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek páciensek a keresési feltételeknek megfelelően.</div>';
        return;
    }

    filteredPatients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.style.borderLeftColor = patient.color || '#8b5cf6';

        const visitDaysText = getVisitDaysText(patient.visitDays || []);

        const emergencyPhoneLink = patient.emergencyPhone
            ? `<a href="tel:${patient.emergencyPhone}">${patient.emergencyPhone}</a>`
            : 'Nincs megadva';

        card.innerHTML = `
            <div class="patient-card-header">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-actions">
                    <button class="icon-btn edit-btn" onclick="editPatient(${patient.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            <div class="patient-info">
                <div class="patient-info-item">
                    <span class="patient-info-label">Telefonszám:</span>
                    <span class="patient-info-value">${patient.phone}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Cím:</span>
                    <span class="patient-info-value">${patient.address || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Kapukód:</span>
                    <span class="patient-info-value">${patient.intercom || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">TAJ:</span>
                    <span class="patient-info-value">${patient.taj || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Értesítendő:</span>
                    <span class="patient-info-value">${patient.emergencyContact || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Értesítendő tel.:</span>
                    <span class="patient-info-value">${emergencyPhoneLink}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Feladatok:</span>
                    <span class="patient-info-value">${patient.tasks || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Látogatási napok:</span>
                    <span class="patient-info-value">${visitDaysText}</span>
                </div>
            </div>
            <div class="call-btn-container">
                <button class="btn btn-call" onclick="callPatient('${patient.phone}')">
                    <i class="fas fa-phone"></i> Hívás
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

function getVisitDaysText(days) {
    const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    return days.map(day => dayNames[day]).join(', ') || 'Nincs ütemezett látogatás';
}

function callPatient(phone) {
    window.location.href = `tel:${phone}`;
}

function editPatient(id) {
    patientToEdit = patients.find(p => p.id === id);
    if (!patientToEdit) return;

    clearPatientForm();

    document.getElementById('name').value = patientToEdit.name;
    document.getElementById('phone').value = patientToEdit.phone;
    document.getElementById('address').value = patientToEdit.address || '';
    document.getElementById('intercom').value = patientToEdit.intercom || '';
    document.getElementById('taj').value = patientToEdit.taj || '';
    document.getElementById('emergencyContact').value = patientToEdit.emergencyContact || '';
    document.getElementById('emergencyPhone').value = patientToEdit.emergencyPhone || '';
    document.getElementById('tasks').value = patientToEdit.tasks || '';
    document.getElementById('patientColor').value = patientToEdit.color || '#8b5cf6';

    document.querySelectorAll('#patientModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = patientToEdit.visitDays && patientToEdit.visitDays.includes(parseInt(checkbox.value));
    });

    document.getElementById('modalTitle').textContent = 'Páciens szerkesztése';
    document.getElementById('deletePatientBtn').classList.remove('hidden');
    document.getElementById('patientModal').classList.add('show');
}

function deletePatient(id) {
    const patient = patients.find(p => p.id === id);
    if (confirm(`Biztosan törölni szeretné ${patient ? patient.name : 'ezt a pácienst'}? Ez az akció visszavonhatatlan és minden hozzá kapcsolódó adatot töröl.`)) {

        patients = patients.filter(p => p.id !== id);
        shoppingItems = shoppingItems.filter(item => parseInt(item.patientId) !== id);
        documents = documents.filter(doc => parseInt(doc.patientId) !== id);
        notes = notes.filter(note => parseInt(note.patientId) !== id);
        savedCalculations = savedCalculations.map(calc => ({
            ...calc,
            data: calc.data.filter(row => parseInt(row.patientId) !== id)
        }));

        localStorage.setItem('patients', JSON.stringify(patients));
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        localStorage.setItem('documents', JSON.stringify(documents));
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));

        renderPatients();
        updatePatientSelects();
        renderShoppingList();
        renderDocuments();
        renderNotes();
        generateCalendar();
        closePatientModal();
        updateCalculatorPatientSelects();
    }
}

function clearPatientForm() {
    const form = document.getElementById('patientForm');
    if (form) {
        form.reset();
    }

    document.querySelectorAll('#patientModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    document.getElementById('patientColor').value = '#8b5cf6';
}

function updatePatientSelects() {
    const selects = ['shoppingPatient', 'documentPatient', 'notePatient'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;

        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name;
            select.appendChild(option);
        });

        select.value = currentValue;
    });

    updateCalculatorPatientSelects();
}

function updateCalculatorPatientSelects() {
    const patientSelects = document.querySelectorAll('#calculation-table .patient-select');
    patientSelects.forEach(select => {
        const currentValue = select.value;
        const optionsHTML = patients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
        select.innerHTML = `<option value="">Válasszon pácienst</option>${optionsHTML}`;
        select.value = currentValue;
    });
}

// Enhanced Calendar functionality with mobile responsiveness
function initializeCalendar() {
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');

    if (calendarMonth && calendarYear) {
        const now = new Date();
        calendarMonth.value = now.getMonth();
        calendarYear.value = now.getFullYear();

        calendarMonth.addEventListener('change', generateCalendar);
        calendarYear.addEventListener('change', generateCalendar);
    }
}

function generateCalendar() {
    const monthSelect = document.getElementById('calendarMonth');
    const yearSelect = document.getElementById('calendarYear');

    if (!monthSelect || !yearSelect) return;

    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);

    if (isNaN(month) || isNaN(year)) return;

    // Generate both desktop and mobile calendar views
    generateDesktopCalendar(month, year);
    generateMobileCalendar(month, year);
}

function generateDesktopCalendar(month, year) {
    const calendar = document.getElementById('calendarGrid');
    if (!calendar) return;

    calendar.innerHTML = '';

    // Calendar headers
    const days = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (dayOfWeek - 1));

    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = currentDate.toISOString();

        if (currentDate.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }

        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = currentDate.getDate();
        dayElement.appendChild(dayNumber);

        // Load visits for this day from the saved calendar data
        const visits = getVisitsForDate(currentDate);

        const visitsContainer = document.createElement('div');
        visitsContainer.className = 'calendar-visits-container';

        const maxVisibleVisits = 3;
        const visibleVisits = visits.slice(0, maxVisibleVisits);
        const hiddenVisitsCount = Math.max(0, visits.length - maxVisibleVisits);

        visibleVisits.forEach(visit => {
            const visitElement = document.createElement('div');
            visitElement.className = 'calendar-visit';
            visitElement.textContent = `${visit.name} (${visit.time})`;
            const patient = patients.find(p => p.name === visit.name);
            visitElement.style.backgroundColor = patient ? patient.color : '#8b5cf6';
            visitElement.title = `Látogatás: ${visit.name} (${visit.time})`;
            visitsContainer.appendChild(visitElement);
        });

        if (hiddenVisitsCount > 0) {
            const overflowElement = document.createElement('div');
            overflowElement.className = 'visits-overflow';
            overflowElement.textContent = `+${hiddenVisitsCount}`;
            visitsContainer.appendChild(overflowElement);
            
            // Add click listener to the whole day element if there is an overflow
            dayElement.addEventListener('click', () => openDayDetailModal(currentDate));
        }

        dayElement.appendChild(visitsContainer);
        calendar.appendChild(dayElement);
    }
}

function generateMobileCalendar(month, year) {
    const mobileView = document.createElement('div');
    mobileView.className = 'calendar-mobile-view';
    mobileView.innerHTML = '<div class="calendar-mobile-list"></div>';

    // Insert mobile view into calendar content
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid && calendarGrid.parentNode) {
        let existingMobileView = calendarGrid.parentNode.querySelector('.calendar-mobile-view');
        if (existingMobileView) {
            existingMobileView.remove();
        }
        calendarGrid.parentNode.insertBefore(mobileView, calendarGrid.nextSibling);
    }

    const mobileList = mobileView.querySelector('.calendar-mobile-list');
    
    // Generate days for the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const visits = getVisitsForDate(currentDate);
        
        // Show all days in mobile view, not just days with visits
        const mobileDay = document.createElement('div');
        mobileDay.className = 'calendar-mobile-day';
        
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            mobileDay.classList.add('today');
        }
        
        const header = document.createElement('div');
        header.className = 'calendar-mobile-day-header';
        
        const dayName = document.createElement('div');
        dayName.className = 'calendar-mobile-day-name';
        dayName.textContent = dayNames[currentDate.getDay()];
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-mobile-day-number';
        dayNumber.textContent = `${month + 1}/${day}`;
        
        header.appendChild(dayName);
        header.appendChild(dayNumber);
        mobileDay.appendChild(header);
        
        const visitsContainer = document.createElement('div');
        visitsContainer.className = 'calendar-mobile-visits';
        
        if (visits.length > 0) {
            visits.forEach(visit => {
                const visitElement = document.createElement('div');
                visitElement.className = 'calendar-mobile-visit';
                
                const patient = patients.find(p => p.name === visit.name);
                if (patient) {
                    visitElement.style.borderLeftColor = patient.color;
                }
                
                const timeElement = document.createElement('div');
                timeElement.className = 'calendar-mobile-visit-time';
                timeElement.textContent = visit.time;
                
                const nameElement = document.createElement('div');
                nameElement.className = 'calendar-mobile-visit-name';
                nameElement.textContent = visit.name;
                
                visitElement.appendChild(timeElement);
                visitElement.appendChild(nameElement);
                visitsContainer.appendChild(visitElement);
            });
        } else {
            const noVisits = document.createElement('div');
            noVisits.className = 'calendar-mobile-no-visits';
            noVisits.textContent = 'Nincs látogatás';
            visitsContainer.appendChild(noVisits);
        }
        
        mobileDay.appendChild(visitsContainer);
        mobileList.appendChild(mobileDay);
    }
}

function getVisitsForDate(date) {
    return savedCalendarData.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate.getFullYear() === date.getFullYear() &&
               visitDate.getMonth() === date.getMonth() &&
               visitDate.getDate() === date.getDate();
    });
}

// Shopping list functionality
function handleShoppingSubmit(e) {
    e.preventDefault();

    const item = {
        id: Date.now(),
        item: document.getElementById('shoppingItem').value,
        patientId: parseInt(document.getElementById('shoppingPatient').value),
        completed: false
    };

    shoppingItems.push(item);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
    document.getElementById('shoppingForm').reset();
}

function renderShoppingList(searchQuery = '') {
    const container = document.getElementById('shoppingList');
    if (!container) return;

    container.innerHTML = '';
    const query = searchQuery.toLowerCase();

    const filteredItems = shoppingItems.filter(item =>
        item.item.toLowerCase().includes(query) ||
        (patients.find(p => p.id === item.patientId)?.name.toLowerCase().includes(query))
    );

    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek tételek a keresési feltételeknek megfelelően.</div>';
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'card-grid';

    filteredItems.forEach(item => {
        const patient = patients.find(p => p.id === item.patientId);
        const patientName = patient ? patient.name : 'Általános';
        const patientColor = patient ? patient.color : '#8b5cf6';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeftColor = patientColor;
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${item.item}</div>
                <div class="card-actions">
                    <button class="icon-btn btn-danger" onclick="deleteShoppingItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div>
                <p class="text-sm text-gray-600">Páciens: ${patientName}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    container.appendChild(gridContainer);
}

function deleteShoppingItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
}

// Document management
function handleDocumentSubmit(e) {
    e.preventDefault();

    const fileInput = document.getElementById('documentFile');
    const file = fileInput.files[0];
    const patientId = document.getElementById('documentPatient').value;

    if (!file || !patientId) {
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Feltöltés...';
    submitBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const documentObj = {
                id: Date.now(),
                name: file.name,
                patientId: parseInt(patientId),
                data: e.target.result,
                type: file.type,
                size: file.size,
                uploadDate: new Date().toLocaleString()
            };

            documents.push(documentObj);
            localStorage.setItem('documents', JSON.stringify(documents));
            renderDocuments();

            document.getElementById('documentForm').reset();
        } catch (error) {
            console.error('Error saving document:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };

    reader.onerror = function() {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    };

    reader.readAsDataURL(file);
}

function renderDocuments(searchQuery = '') {
    const container = document.getElementById('documentsList');
    if (!container) return;

    container.innerHTML = '';
    const query = searchQuery.toLowerCase();

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        (patients.find(p => p.id === doc.patientId)?.name.toLowerCase().includes(query))
    );

    if (filteredDocs.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek dokumentumok a keresési feltételeknek megfelelően.</div>';
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'card-grid';

    filteredDocs.forEach(doc => {
        const patient = patients.find(p => p.id === doc.patientId);
        const patientName = patient ? patient.name : 'Ismeretlen páciens';
        const patientColor = patient ? patient.color : '#8b5cf6';
        const fileSize = doc.size ? formatFileSize(doc.size) : 'Ismeretlen méret';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeftColor = patientColor;
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${doc.name}</div>
                <div class="card-actions">
                    <button class="icon-btn" onclick="viewDocument(${doc.id})" title="Megtekintés">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-btn" onclick="downloadDocument(${doc.id})" title="Letöltés">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="icon-btn btn-danger" onclick="deleteDocument(${doc.id})" title="Törlés">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div>
                <p class="text-sm text-gray-600">Páciens: ${patientName}</p>
                <p class="text-xs text-gray-500">Méret: ${fileSize} | Feltöltve: ${doc.uploadDate}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    container.appendChild(gridContainer);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function viewDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        const newWindow = window.open();
        if (doc.type.startsWith('image/')) {
            newWindow.document.write(`
                <html>
                    <head><title>${doc.name}</title></head>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                        <img src="${doc.data}" style="max-width:100%; max-height:100%; object-fit:contain;" alt="${doc.name}">
                    </body>
                </html>
            `);
        } else if (doc.type === 'application/pdf') {
            newWindow.location.href = doc.data;
        } else {
            downloadDocument(id);
            newWindow.close();
        }
    }
}

function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        link.click();
    }
}

function deleteDocument(id) {
    if (confirm('Biztosan törölni szeretné ezt a dokumentumot?')) {
        documents = documents.filter(d => d.id !== id);
        localStorage.setItem('documents', JSON.stringify(documents));
        renderDocuments();
    }
}

// Notes functionality
function handleNoteSubmit(e) {
    e.preventDefault();

    const note = {
        id: Date.now(),
        content: document.getElementById('noteContent').value,
        patientId: parseInt(document.getElementById('notePatient').value),
        date: new Date().toLocaleString()
    };

    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
    document.getElementById('noteForm').reset();
}

function renderNotes(searchQuery = '') {
    const container = document.getElementById('notesList');
    if (!container) return;

    container.innerHTML = '';
    const query = searchQuery.toLowerCase();

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(query) ||
        (patients.find(p => p.id === note.patientId)?.name.toLowerCase().includes(query))
    );

    if (filteredNotes.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek jegyzetek a keresési feltételeknek megfelelően.</div>';
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'card-grid';

    filteredNotes.forEach(note => {
        const patient = patients.find(p => p.id === note.patientId);
        const patientName = patient ? patient.name : 'Általános';
        const patientColor = patient ? patient.color : '#8b5cf6';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeftColor = patientColor;
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">Jegyzet</div>
                <div class="card-actions">
                    <button class="icon-btn btn-danger" onclick="deleteNote(${note.id})" title="Törlés">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div>
                <p class="text-sm text-gray-600">Páciens: ${patientName}</p>
                <p class="text-xs text-gray-500">Dátum: ${note.date}</p>
                <p class="mt-2 text-gray-700">${note.content}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    container.appendChild(gridContainer);
}

function deleteNote(id) {
    if (confirm('Biztosan törölni szeretné ezt a jegyzetet?')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
    }
}

// Data management
function downloadAllData() {
    try {
        const allData = {
            patients: patients,
            shoppingItems: shoppingItems,
            documents: documents,
            notes: notes,
            savedCalculations: savedCalculations,
            savedCalendarData: savedCalendarData
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'elderly_care_data.json';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading data:', error);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const uploadedData = JSON.parse(e.target.result);

            if (uploadedData.patients && Array.isArray(uploadedData.patients)) {
                patients = uploadedData.patients;
                localStorage.setItem('patients', JSON.stringify(patients));
            }
            if (uploadedData.shoppingItems && Array.isArray(uploadedData.shoppingItems)) {
                shoppingItems = uploadedData.shoppingItems;
                localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
            }
            if (uploadedData.documents && Array.isArray(uploadedData.documents)) {
                documents = uploadedData.documents;
                localStorage.setItem('documents', JSON.stringify(documents));
            }
            if (uploadedData.notes && Array.isArray(uploadedData.notes)) {
                notes = uploadedData.notes;
                localStorage.setItem('notes', JSON.stringify(notes));
            }
            if (uploadedData.savedCalculations && Array.isArray(uploadedData.savedCalculations)) {
                savedCalculations = uploadedData.savedCalculations;
                localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
            }
            if (uploadedData.savedCalendarData && Array.isArray(uploadedData.savedCalendarData)) {
                savedCalendarData = uploadedData.savedCalendarData;
                localStorage.setItem('savedCalendarData', JSON.stringify(uploadedData.savedCalendarData));
            }

            renderPatients();
            renderShoppingList();
            renderDocuments();
            renderNotes();
            updatePatientSelects();
            generateCalendar();

            alert('Az adatok sikeresen feltöltve!');

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Hiba a fájl feldolgozásakor. Kérjük, ellenőrizze, hogy a fájl érvényes JSON formátumú.');
        }
    };
    reader.readAsText(file);
}

// Enhanced Calculator functionality with daily restriction
function initializeCalculator() {
    const tableBody = document.getElementById('table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearBtn = document.getElementById('clear-table-btn');
    const saveBtn = document.getElementById('save-btn');
    const saveModal = document.getElementById('save-modal');
    const saveNameInput = document.getElementById('save-name-input');
    const saveConfirmBtn = document.getElementById('save-confirm-btn');
    const saveCancelBtn = document.getElementById('save-cancel-btn');
    const savedList = document.getElementById('saved-calculations-list');

    if (tableBody) {
        // Add 12 initial rows
        for (let i = 1; i <= 12; i++) {
            tableBody.appendChild(createCalculatorRow({}));
        }
        updateAllCalculations();
        renderSavedCalculationsList();
        
        // Add event listener to the table body for changes
        // This is the key to syncing the calculator to the calendar in real-time
        tableBody.addEventListener('input', updateAndSyncCalendar);
    }

    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
            tableBody.appendChild(createCalculatorRow({}));
            updateAndSyncCalendar();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Biztosan törölni szeretné az összes sort a táblázatból?')) {
                clearTable();
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            isRenameMode = false;
            document.getElementById('modal-title').textContent = "Számítás mentése";
            saveConfirmBtn.textContent = "Mentés";
            
            // Set the save name to the current day or the loaded day if available
            const saveDate = currentCalculationDate ? new Date(currentCalculationDate) : new Date();
            const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
            const dayName = dayNames[saveDate.getDay()];
            const formattedDate = `${dayName}__${saveDate.getFullYear()}-${String(saveDate.getMonth() + 1).padStart(2, '0')}-${String(saveDate.getDate()).padStart(2, '0')}__${String(saveDate.getHours()).padStart(2, '0')}:${String(saveDate.getMinutes()).padStart(2, '0')}`;
            saveNameInput.value = formattedDate;

            saveModal.classList.add('show');
            saveNameInput.focus();
        });
    }

    if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', () => {
            const name = saveNameInput.value.trim();
            if (name) {
                if (isRenameMode) {
                    renameCalculation(renameId, name);
                } else {
                    saveCalculation(name, currentCalculationDate);
                }
                saveModal.classList.remove('show');
                saveNameInput.value = '';
            } else {
                alert('Kérjük, adja meg a számítás nevét.');
            }
        });
    }

    if (saveCancelBtn) {
        saveCancelBtn.addEventListener('click', () => {
            saveModal.classList.remove('show');
            saveNameInput.value = '';
        });
    }

    if (savedList) {
        savedList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const parentDiv = button.closest('[data-id]');
            if (!parentDiv) return;

            const id = parentDiv.dataset.id;

            if (button.classList.contains('load-btn')) {
                loadCalculation(id);
            } else if (button.classList.contains('delete-btn')) {
                deleteCalculation(id);
            } else if (button.classList.contains('rename-btn')) {
                isRenameMode = true;
                renameId = id;
                const currentItem = savedCalculations.find(item => item.id === id);
                if (currentItem) {
                    document.getElementById('modal-title').textContent = "Név szerkesztése";
                    saveConfirmBtn.textContent = "Átnevezés";
                    saveNameInput.value = currentItem.name;
                    saveModal.classList.add('show');
                    saveNameInput.focus();
                }
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCsv);
    }
}

// Clears the table and sets it back to 12 empty rows
function clearTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        tableBody.appendChild(createCalculatorRow({}));
    }
    // No need to clear calendar data, as this is a local action
    updateAllCalculations();
}

// Helper function to update all calculations and then sync to calendar
function updateAndSyncCalendar() {
    updateAllCalculations();
    syncCalculatorToCalendar(currentCalculationDate);
}

// Syncs the current calculator data to the calendar for the specified date
function syncCalculatorToCalendar(dateToSync) {
    const syncDate = dateToSync ? new Date(dateToSync) : new Date();
    const syncDayString = syncDate.toISOString().split('T')[0];

    const tableRows = document.querySelectorAll('#table-body tr');
    const patientVisits = [];
    tableRows.forEach(row => {
        const patientSelect = row.querySelector('.patient-select');
        const patientId = patientSelect.value;
        const timeElement = row.querySelector('.ora-perc-total');
        const timeRange = timeElement.textContent.trim();

        if (patientId) {
            const patient = patients.find(p => String(p.id) === String(patientId));
            patientVisits.push({
                name: patient ? patient.name : 'Ismeretlen Páciens',
                date: syncDate.toISOString(),
                time: timeRange
            });
        }
    });

    // Remove any existing entries for the specified date
    savedCalendarData = savedCalendarData.filter(visit => {
        const visitDate = new Date(visit.date);
        const visitDayString = visitDate.toISOString().split('T')[0];
        return visitDayString !== syncDayString;
    });

    // Add the new visits
    savedCalendarData.push(...patientVisits);
    localStorage.setItem('savedCalendarData', JSON.stringify(savedCalendarData));

    // Refresh the calendar view
    generateCalendar();
}

function createCalculatorRow(rowData) {
    const newRow = document.createElement('tr');
    const patientSelect = document.createElement('select');
    patientSelect.className = 'form-select patient-select';

    // Populate the select with all patients
    const optionsHTML = patients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
    patientSelect.innerHTML = `<option value="">Válasszon pácienst</option>${optionsHTML}`;

    newRow.innerHTML = `
        <td></td>
        <td>
            <input type="number" class="number-input gond1-input" value="${rowData.gond1 || ''}" min="0">
        </td>
        <td>
            <input type="number" class="number-input gond2-input" value="${rowData.gond2 || ''}" min="0">
        </td>
        <td>
            <input type="number" class="number-input gond-utazas-input" value="${rowData.gondUtazas || ''}" min="0">
        </td>
        <td>
            <div class="ora-perc-total">00:00 - 00:00</div>
        </td>
    `;
    newRow.querySelector('td').prepend(patientSelect);

    if (rowData.patientId) {
        patientSelect.value = rowData.patientId;
    }

    return newRow;
}

function updateAllCalculations() {
    const tableRows = document.querySelectorAll('#table-body tr');
    let previousEndTimeMinutes = 8 * 60; // Start time for the first row (08:00)

    tableRows.forEach((row, index) => {
        const gond1 = parseInt(row.querySelector('.gond1-input').value) || 0;
        const gond2 = parseInt(row.querySelector('.gond2-input').value) || 0;
        const gondUtazasTotal = parseInt(row.querySelector('.gond-utazas-input').value) || 0;

        let newStartTimeMinutes;
        let newEndTimeMinutes;

        if (index === 0) {
            newStartTimeMinutes = previousEndTimeMinutes;
            newEndTimeMinutes = newStartTimeMinutes + gondUtazasTotal;
        } else {
            const travelTime = gondUtazasTotal - (gond1 + gond2);
            newStartTimeMinutes = previousEndTimeMinutes + travelTime;
            newEndTimeMinutes = newStartTimeMinutes + gond1 + gond2;
        }

        const timeRange = `${minutesToTime(newStartTimeMinutes)} - ${minutesToTime(newEndTimeMinutes)}`;
        row.querySelector('.ora-perc-total').textContent = timeRange;
        previousEndTimeMinutes = newEndTimeMinutes;
    });
}

function minutesToTime(totalMinutes) {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getTableData() {
    const rows = Array.from(document.querySelectorAll('#table-body tr')).map(row => {
        const patientSelect = row.querySelector('.patient-select');
        const inputs = row.querySelectorAll('input');
        return {
            patientId: patientSelect ? patientSelect.value : '',
            gond1: inputs[0].value,
            gond2: inputs[1].value,
            gondUtazas: inputs[2].value
        };
    });
    return rows;
}

// Updated save function to handle specific dates
function saveCalculation(name, dateToSave) {
    const saveDate = dateToSave ? new Date(dateToSave) : new Date();
    const saveDateString = saveDate.toISOString().split('T')[0];
    
    // First, update the calendar data
    syncCalculatorToCalendar(saveDate);

    // Remove any existing calculation for the specified date
    savedCalculations = savedCalculations.filter(calc => {
        const calcDate = new Date(calc.created);
        const calcDateString = calcDate.toISOString().split('T')[0];
        return calcDateString !== saveDateString;
    });

    // Then, save the new calculation data
    const calculationData = getTableData();
    const newCalculation = {
        id: `calc-${Date.now()}`,
        name: name,
        created: saveDate.toISOString(),
        lastEdited: new Date().toISOString(),
        data: calculationData
    };

    savedCalculations.push(newCalculation);
    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));

    renderSavedCalculationsList();
    
    alert(`Számítás mentve! A számítás a(z) ${saveDate.toLocaleDateString()} naphoz lett hozzárendelve.`);
    
    // Clear the table after saving
    clearTable();
}

function renameCalculation(id, newName) {
    const itemToRename = savedCalculations.find(item => item.id === id);

    if (itemToRename) {
        itemToRename.name = newName;
        itemToRename.lastEdited = new Date().toISOString();
        localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
        renderSavedCalculationsList();
    }
}

// This is the core function for loading saved data and syncing it to the calendar
function loadCalculation(id) {
    const itemToLoad = savedCalculations.find(item => item.id === id);
    const tableBody = document.getElementById('table-body');

    if (itemToLoad && tableBody) {
        tableBody.innerHTML = '';

        // Set the global variable to the date of the loaded calculation
        currentCalculationDate = itemToLoad.created;

        if (itemToLoad.data.length === 0) {
            // Create empty rows
            for (let i = 0; i < 12; i++) {
                tableBody.appendChild(createCalculatorRow({}));
            }
        } else {
            // Create and populate the table rows
            itemToLoad.data.forEach(rowData => {
                tableBody.appendChild(createCalculatorRow(rowData));
            });
        }

        const now = new Date().toISOString();
        const itemIndex = savedCalculations.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            savedCalculations[itemIndex].lastEdited = now;
            localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
        }

        // After loading, update the calculations and sync to the calendar
        updateAllCalculations();
        syncCalculatorToCalendar(currentCalculationDate);
        renderSavedCalculationsList();
    }
}

function deleteCalculation(id) {
    if (confirm('Biztosan törölni szeretné ezt a számítást?')) {
        savedCalculations = savedCalculations.filter(item => item.id !== id);
        localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
        syncCalculatorToCalendar(currentCalculationDate);
        renderSavedCalculationsList();
    }
}

function renderSavedCalculationsList() {
    const savedList = document.getElementById('saved-calculations-list');
    if (!savedList) return;

    savedList.innerHTML = '';

    if (savedCalculations.length === 0) {
        savedList.innerHTML = '<div class="empty-state">Nincsenek mentett számítások.</div>';
        return;
    }

    // Sort calculations by creation date (newest first)
    const sortedCalculations = [...savedCalculations].sort((a, b) => new Date(b.created) - new Date(a.created));

    sortedCalculations.forEach(item => {
        const savedItemDiv = document.createElement('div');
        savedItemDiv.classList.add('saved-item');
        savedItemDiv.dataset.id = item.id;

        const createdDate = new Date(item.created);
        const isToday = createdDate.toDateString() === new Date().toDateString();
        const dayIndicator = isToday ? ' (Ma)' : '';

        savedItemDiv.innerHTML = `
            <div class="saved-item-info">
                <h4>${item.name}${dayIndicator}</h4>
                <p>Mentve: ${new Date(item.created).toLocaleString()}</p>
                <p>Utoljára szerkesztve: ${new Date(item.lastEdited).toLocaleString()}</p>
            </div>
            <div class="saved-item-actions">
                <button class="btn btn-primary load-btn">Betöltés</button>
                <button class="btn btn-secondary rename-btn">Átnevez</button>
                <button class="btn btn-danger delete-btn">Törlés</button>
            </div>
        `;

        // Highlight today's entry with lilac styling
        if (isToday) {
            savedItemDiv.style.background = 'linear-gradient(135deg, #f3f0ff 0%, #e9e5ff 100%)';
            savedItemDiv.style.border = '1px solid #d4c7ff';
        }

        savedList.appendChild(savedItemDiv);
    });
}

function exportToCsv() {
    const tableRows = document.querySelectorAll('#table-body tr');
    if (tableRows.length === 0) {
        alert('A táblázat üres. Nincs mit exportálni.');
        return;
    }

    const header = ['Név', 'Gondozási idő 1', 'Gondozási idő 2', 'Gond. idő + Utazás', 'Óra és perc'].join(';');
    const rows = Array.from(tableRows).map(row => {
        const patientSelect = row.querySelector('.patient-select');
        const patientName = patientSelect ? patientSelect.options[patientSelect.selectedIndex].text : '';
        const rowData = [
            patientName,
            row.querySelector('.gond1-input').value,
            row.querySelector('.gond2-input').value,
            row.querySelector('.gond-utazas-input').value,
            row.querySelector('.ora-perc-total').textContent.trim()
        ];
        return rowData.join(';');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Add date to filename
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    link.download = `Kiszamolo_${dateString}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
