// A JavaScript kód a könnyebb kezelhetőség és karbantarthatóság érdekében a script.js fájlba került át.

// Data storage
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let shoppingItems = JSON.parse(localStorage.getItem('shoppingItems')) || [];
let documents = JSON.parse(localStorage.getItem('documents')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// UI element references
const addPatientBtn = document.getElementById('addPatientBtn');
const patientFormContainer = document.getElementById('patientFormContainer');
const patientsTab = document.getElementById('patients');
const patientSearchInput = document.getElementById('patientSearchInput');
const shoppingSearchInput = document.getElementById('shoppingSearchInput');
const documentsSearchInput = document.getElementById('documentsSearchInput');
const notesSearchInput = document.getElementById('notesSearchInput');
const patientForm = document.getElementById('patientForm');
const uploadFile = document.getElementById('uploadFile');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');

// Keep track of the patient being edited
let patientToEdit = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alkalmazás inicializálása...');
    
    try {
        const storedPatients = localStorage.getItem('patients');
        const storedShoppingItems = localStorage.getItem('shoppingItems');
        const storedDocuments = localStorage.getItem('documents');
        const storedNotes = localStorage.getItem('notes');
        
        patients = storedPatients ? JSON.parse(storedPatients) : [];
        shoppingItems = storedShoppingItems ? JSON.parse(storedShoppingItems) : [];
        documents = storedDocuments ? JSON.parse(storedDocuments) : [];
        notes = storedNotes ? JSON.parse(storedNotes) : [];
        
        console.log('Páciensek betöltve a tárolóból:', patients);
        console.log('Helyi tároló elérhető:', typeof(Storage) !== "undefined");
        
    } catch (error) {
        console.error('Hiba a helyi tároló adatainak betöltésekor:', error);
        patients = [];
        shoppingItems = [];
        documents = [];
        notes = [];
    }
    
    renderPatients();
    renderShoppingList();
    renderDocuments();
    renderNotes();
    updatePatientSelects();
    initializeCalendar();
    generateCalendar();
    
    console.log('Alkalmazás sikeresen inicializálva');

    // **Start of Kiszámoló (Calculator) specific initialization**
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
    const modalTitle = document.getElementById('modal-title');

    if (tableBody) {
        // Add 12 initial rows
        for (let i = 1; i <= 12; i++) {
            tableBody.appendChild(createRow(''));
        }
        updateAllCalculations();
        renderSavedList();
    }

    if (addRowBtn) addRowBtn.addEventListener('click', () => {
        tableBody.appendChild(createRow(''));
        updateAllCalculations();
    });

    if (clearBtn) clearBtn.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.classList.add('fixed', 'top-0', 'left-0', 'w-full', 'h-full', 'bg-gray-800', 'bg-opacity-50', 'flex', 'justify-center', 'items-center', 'z-50');
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm mx-4">
                <p class="mb-4">Biztosan törölni szeretné az összes sort?</p>
                <div class="flex justify-center space-x-4">
                    <button id="confirm-yes" class="bg-red-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-red-600 transition-colors duration-200">Igen</button>
                    <button id="confirm-no" class="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-full hover:bg-gray-400 transition-colors duration-200">Mégsem</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('confirm-yes').addEventListener('click', () => {
            tableBody.innerHTML = '';
            for (let i = 1; i <= 12; i++) {
                tableBody.appendChild(createRow(''));
            }
            updateAllCalculations();
            document.body.removeChild(modal);
        });

        document.getElementById('confirm-no').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    });

    if (saveBtn) saveBtn.addEventListener('click', () => {
        isRenameMode = false;
        modalTitle.textContent = "Számítás mentése";
        saveConfirmBtn.textContent = "Mentés";
        
        const now = new Date();
        const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
        const dayName = dayNames[now.getDay()];
        const formattedDate = `${dayName}__${now.getFullYear()} - ${String(now.getMonth() + 1).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}__${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        saveNameInput.value = formattedDate;

        saveModal.classList.remove('hidden');
        saveNameInput.focus();
    });

    if (saveConfirmBtn) saveConfirmBtn.addEventListener('click', () => {
        const name = saveNameInput.value.trim();
        if (name) {
            if (isRenameMode) {
                renameCalculation(renameId, name);
            } else {
                saveCalculation(name);
            }
            saveModal.classList.add('hidden');
            saveNameInput.value = '';
        } else {
            alert('Kérjük, adja meg a számítás nevét.');
        }
    });

    if (saveCancelBtn) saveCancelBtn.addEventListener('click', () => {
        saveModal.classList.add('hidden');
        saveNameInput.value = '';
    });

    if (savedList) savedList.addEventListener('click', (e) => {
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
            const savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
            const currentItem = savedData.find(item => item.id === id);
            if (currentItem) {
                modalTitle.textContent = "Név szerkesztése";
                saveConfirmBtn.textContent = "Átnevezés";
                saveNameInput.value = currentItem.name;
                saveModal.classList.remove('hidden');
                saveNameInput.focus();
            }
        }
    });

    if (exportBtn) exportBtn.addEventListener('click', exportToCsv);
    // **End of Kiszámoló specific initialization**
});

// Tab switching
function showTab(tabName) {
    // Elrejtjük a legördülő menüt, amikor egy másik fülre kattintunk
    closeSettingsDropdown();
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    let activeNavTab = document.querySelector(`.nav-tab[onclick*='${tabName}']`);
    if (activeNavTab) {
        activeNavTab.classList.add('active');
    }

    if (tabName === 'patients') {
        addPatientBtn.style.display = 'block';
    } else {
        addPatientBtn.style.display = 'none';
        closeForm();
    }

    if (tabName === 'calendar') {
        generateCalendar();
    }
    if (tabName === 'shopping') {
        renderShoppingList(shoppingSearchInput.value);
    }
    if (tabName === 'documents') {
        renderDocuments(documentsSearchInput.value);
    }
    if (tabName === 'notes') {
        renderNotes(notesSearchInput.value);
    }
}

// Új függvény a beállítások legördülő menüjének kezelésére
function toggleSettingsDropdown() {
    settingsDropdown.classList.toggle('visible');
}

function closeSettingsDropdown() {
    settingsDropdown.classList.remove('visible');
}

// Klick esemény figyelője a menün kívüli területekre
document.addEventListener('click', function(event) {
    const isClickInside = settingsBtn.contains(event.target) || settingsDropdown.contains(event.target);
    if (!isClickInside) {
        closeSettingsDropdown();
    }
});

// New/Refactored Form Show/Hide Logic
function openForm() {
    patientToEdit = null;
    clearForm();
    patientFormContainer.classList.add('visible');
    addPatientBtn.classList.add('close');
    patientFormContainer.scrollIntoView({ behavior: 'smooth' });
}

function closeForm() {
    patientFormContainer.classList.remove('visible');
    addPatientBtn.classList.remove('close');
    clearForm();
    patientToEdit = null;
}

// Event listeners for form control
if (addPatientBtn) {
    addPatientBtn.addEventListener('click', () => {
        if (patientsTab.classList.contains('active')) {
            if (patientFormContainer.classList.contains('visible')) {
                closeForm();
            } else {
                openForm();
            }
        }
    });
}

if (patientFormContainer) {
    patientFormContainer.addEventListener('pointerdown', (e) => {
        if (e.target.id === 'patientFormContainer') {
            closeForm();
        }
    });
}


// Patient search functionality
if (patientSearchInput) {
    patientSearchInput.addEventListener('input', (e) => {
        renderPatients(e.target.value);
    });
}

// Shopping list search functionality
if (shoppingSearchInput) {
    shoppingSearchInput.addEventListener('input', (e) => {
        renderShoppingList(e.target.value);
    });
}

// Documents search functionality
if (documentsSearchInput) {
    documentsSearchInput.addEventListener('input', (e) => {
        renderDocuments(e.target.value);
    });
}

// Notes search functionality
if (notesSearchInput) {
    notesSearchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });
}


// Patient management
if (patientForm) {
    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        
        if (!nameInput.value.trim()) {
            nameInput.reportValidity();
            nameInput.focus();
            return;
        }
        
        if (!phoneInput.value.trim()) {
            phoneInput.reportValidity();
            phoneInput.focus();
            return;
        }
        
        const visitDays = [];
        const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked');
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
            closeForm();
            
        } catch (error) {
            console.error('Hiba a páciens mentésekor:', error);
        }
    });
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

    console.log('Páciensek renderelése:', filteredPatients);
    
    if (filteredPatients.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Nincsenek páciensek a keresési feltételeknek megfelelően.</p>';
        return;
    }

    filteredPatients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.style.borderLeftColor = patient.color || '#667eea';
        
        const visitDaysText = getVisitDaysText(patient.visitDays || []);
        
        // Hívható telefonszám létrehozása az "Értesítendő telefonszáma" mezőhöz
        const emergencyPhoneLink = patient.emergencyPhone
            ? `<a href="tel:${patient.emergencyPhone}" style="color: #667eea; text-decoration: underline;">${patient.emergencyPhone}</a>`
            : 'Nincs megadva';

        card.innerHTML = `
            <div class="patient-card-header">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-actions">
                    <button class="icon-btn edit-btn" onclick="editPatient(${patient.id})">
                        <i class="material-icons">edit</i>
                    </button>
                </div>
            </div>
            <p><strong>Telefonszám:</strong> ${patient.phone}</p>
            <p><strong>Cím:</strong> ${patient.address || 'Nincs megadva'}</p>
            <p><strong>Kapukód:</strong> ${patient.intercom || 'Nincs megadva'}</p>
            <p><strong>TAJ:</strong> ${patient.taj || 'Nincs megadva'}</p>
            <p><strong>Értesítendő:</strong> ${patient.emergencyContact || 'Nincs megadva'}</p>
            <p><strong>Értesítendő telefonszáma:</strong> ${emergencyPhoneLink}</p>
            <p><strong>Feladatok:</strong> ${patient.tasks || 'Nincs megadva'}</p>
            <p><strong>Látogatási napok:</strong> ${visitDaysText}</p>
            <div class="call-btn-container">
                <button class="btn btn-call" onclick="callPatient('${patient.phone}')">📞 Hívás</button>
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

function deletePatient(id) {
    const patient = patients.find(p => p.id === id);
    if (confirm(`Biztosan törölni szeretné ${patient ? patient.name : 'ezt a pácienst'}? Ez az akció visszavonhatatlan és minden hozzá kapcsolódó adatot töröl.`)) {
        
        // Filter out the patient
        patients = patients.filter(p => p.id !== id);
        
        // Filter out associated data, ensuring type consistency
        shoppingItems = shoppingItems.filter(item => parseInt(item.patientId) !== id);
        documents = documents.filter(doc => parseInt(doc.patientId) !== id);
        notes = notes.filter(note => parseInt(note.patientId) !== id);
        
        localStorage.setItem('patients', JSON.stringify(patients));
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        localStorage.setItem('documents', JSON.stringify(documents));
        localStorage.setItem('notes', JSON.stringify(notes));
        
        renderPatients();
        updatePatientSelects();
        renderShoppingList();
        renderDocuments();
        renderNotes();
        generateCalendar();
        closeForm();
    }
}

function clearForm() {
    if (patientForm) {
        patientForm.reset();
    }
    
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById('patientColor').value = '#667eea';
    
    // Remove the dynamic buttons when clearing the form
    const deleteBtn = patientForm.querySelector('.btn-delete');
    if (deleteBtn) deleteBtn.remove();
    const cancelBtn = patientForm.querySelector('.btn-cancel');
    if (cancelBtn) cancelBtn.remove();
    
    // Change submit button text back to default
    patientForm.querySelector('.btn[type="submit"]').textContent = 'Mentés';
    
    console.log('Űrlap törölve');
}

function editPatient(id) {
    patientToEdit = patients.find(p => p.id === id);
    if (!patientToEdit) return;
    
    clearForm();

    document.getElementById('name').value = patientToEdit.name;
    document.getElementById('phone').value = patientToEdit.phone;
    document.getElementById('address').value = patientToEdit.address || '';
    document.getElementById('intercom').value = patientToEdit.intercom || '';
    document.getElementById('taj').value = patientToEdit.taj || '';
    document.getElementById('emergencyContact').value = patientToEdit.emergencyContact || '';
    document.getElementById('emergencyPhone').value = patientToEdit.emergencyPhone || '';
    document.getElementById('tasks').value = patientToEdit.tasks || '';
    document.getElementById('patientColor').value = patientToEdit.color || '#667eea';
    
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = patientToEdit.visitDays && patientToEdit.visitDays.includes(parseInt(checkbox.value));
    });
    
    const submitBtn = patientForm.querySelector('.btn[type="submit"]');
    submitBtn.textContent = 'Frissítés';
    
    const existingCancelBtn = patientForm.querySelector('.btn-cancel');
    if (existingCancelBtn) existingCancelBtn.remove();

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Mégse';
    cancelBtn.type = 'button';
    cancelBtn.onclick = () => {
        closeForm();
    };
    submitBtn.insertAdjacentElement('afterend', cancelBtn);
    
    showDeleteButton(id);
    
    patientFormContainer.classList.add('visible');
    addPatientBtn.classList.add('close');
    patientFormContainer.scrollIntoView({ behavior: 'smooth' });
}

function showDeleteButton(patientId) {
    const existingDeleteBtn = patientForm.querySelector('.btn-delete');
    if (existingDeleteBtn) {
        existingDeleteBtn.remove();
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-delete';
    deleteBtn.textContent = 'Páciens törlése';
    deleteBtn.type = 'button';
    deleteBtn.onclick = () => {
        deletePatient(patientId);
    };
    
    patientForm.appendChild(deleteBtn);
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
}

// Calendar functionality
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
    const month = parseInt(document.getElementById('calendarMonth').value);
    const year = parseInt(document.getElementById('calendarYear').value);
    
    if (isNaN(month) || isNaN(year)) return;
    
    const calendar = document.getElementById('calendarGrid');
    if (!calendar) return;
    calendar.innerHTML = '';
    
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
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = currentDate.getDate();
        
        if (currentDate.getMonth() !== month) {
            dayElement.style.opacity = '0.3';
        }
        
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.style.backgroundColor = '#f0f8ff';
            dayElement.style.border = '2px solid #667eea';
        }
        
        dayElement.appendChild(dayNumber);
        
        const dayOfWeekForVisit = currentDate.getDay();
        let visitDayValue = dayOfWeekForVisit;
        
        patients.forEach(patient => {
            if (patient.visitDays && patient.visitDays.includes(visitDayValue)) {
                const visit = document.createElement('span');
                visit.className = 'calendar-visit';
                visit.textContent = patient.name;
                visit.style.backgroundColor = patient.color || '#667eea';
                visit.style.color = 'white';
                visit.title = `Látogatás: ${patient.name}`;
                dayElement.appendChild(visit);
            }
        });
        
        calendar.appendChild(dayElement);
    }
}

// Shopping list functionality
if (document.getElementById('shoppingForm')) {
    document.getElementById('shoppingForm').addEventListener('submit', function(e) {
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
    });
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
    
    const groupedItems = filteredItems.reduce((acc, item) => {
        const patient = patients.find(p => p.id === item.patientId);
        const patientName = patient ? patient.name : 'Általános';
        const patientColor = patient ? patient.color : '#667eea';
        const patientId = patient ? patient.id : 'general';

        if (!acc[patientId]) {
            acc[patientId] = {
                name: patientName,
                color: patientColor,
                items: []
            };
        }
        acc[patientId].items.push(item);
        return acc;
    }, {});

    const sortedGroups = Object.keys(groupedItems).sort((a, b) => {
        if (a === 'general') return -1;
        if (b === 'general') return 1;
        return groupedItems[a].name.localeCompare(groupedItems[b].name, 'hu');
    });

    if (sortedGroups.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Nincsenek tételek a keresési feltételeknek megfelelően.</p>';
        return;
    }

    sortedGroups.forEach(patientId => {
        const group = groupedItems[patientId];
        const groupElement = document.createElement('div');
        groupElement.className = 'patient-group';
        
        const heading = document.createElement('h3');
        heading.textContent = group.name;
        heading.style.color = group.color;
        heading.style.borderLeft = `3px solid ${group.color}`;
        heading.style.paddingLeft = '10px';
        groupElement.appendChild(heading);

        group.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shopping-item';
            itemElement.innerHTML = `
                <div>
                    <strong>${item.item}</strong>
                </div>
                <button class="btn btn-delete" onclick="deleteShoppingItem(${item.id})">Eltávolítás</button>
            `;
            groupElement.appendChild(itemElement);
        });
        container.appendChild(groupElement);
    });
}

function deleteShoppingItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
}

// Document management
if (document.getElementById('documentForm')) {
    document.getElementById('documentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('documentFile');
        const file = fileInput.files[0];
        const patientId = document.getElementById('documentPatient').value;
        
        if (!file) {
            fileInput.reportValidity();
            return;
        }
        
        if (!patientId) {
            document.getElementById('documentPatient').reportValidity();
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
                console.error('Hiba a dokumentum mentésekor:', error);
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
    });
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
    
    const groupedDocs = filteredDocs.reduce((acc, doc) => {
        const patient = patients.find(p => p.id === doc.patientId);
        const patientName = patient ? patient.name : 'Ismeretlen páciens';
        const patientColor = patient ? patient.color : '#667eea';
        const patientId = patient ? patient.id : 'unknown';

        if (!acc[patientId]) {
            acc[patientId] = {
                name: patientName,
                color: patientColor,
                docs: []
            };
        }
        acc[patientId].docs.push(doc);
        return acc;
    }, {});

    const sortedGroups = Object.keys(groupedDocs).sort((a, b) => {
        if (a === 'unknown') return -1;
        if (b === 'unknown') return 1;
        return groupedDocs[a].name.localeCompare(groupedDocs[b].name, 'hu');
    });

    if (sortedGroups.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Nincsenek dokumentumok a keresési feltételeknek megfelelően.</p>';
        return;
    }

    sortedGroups.forEach(patientId => {
        const group = groupedDocs[patientId];
        const groupElement = document.createElement('div');
        groupElement.className = 'patient-group';
        
        const heading = document.createElement('h3');
        heading.textContent = group.name;
        heading.style.color = group.color;
        heading.style.borderLeft = `3px solid ${group.color}`;
        heading.style.paddingLeft = '10px';
        groupElement.appendChild(heading);

        group.docs.forEach(doc => {
            const fileSize = doc.size ? formatFileSize(doc.size) : 'Ismeretlen méret';
            const docElement = document.createElement('div');
            docElement.className = 'document-item';
            docElement.innerHTML = `
                <div>
                    <strong>${doc.name}</strong>
                    <div style="font-size: 14px; color: #718096;">
                        Méret: ${fileSize} | Feltöltve: ${doc.uploadDate}
                    </div>
                </div>
                <div>
                    <button class="btn" onclick="viewDocument(${doc.id})">Megtekintés</button>
                    <button class="btn" onclick="downloadDocument(${doc.id})">Letöltés</button>
                    <button class="btn btn-delete" onclick="deleteDocument(${doc.id})">Törlés</button>
                </div>
            `;
            groupElement.appendChild(docElement);
        });
        container.appendChild(groupElement);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bájt', 'KB', 'MB', 'GB'];
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
if (document.getElementById('noteForm')) {
    document.getElementById('noteForm').addEventListener('submit', function(e) {
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
    });
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

    const groupedNotes = filteredNotes.reduce((acc, note) => {
        const patient = patients.find(p => p.id === note.patientId);
        const patientName = patient ? patient.name : 'Általános';
        const patientColor = patient ? patient.color : '#667eea';
        const patientId = patient ? patient.id : 'general';

        if (!acc[patientId]) {
            acc[patientId] = {
                name: patientName,
                color: patientColor,
                notes: []
            };
        }
        acc[patientId].notes.push(note);
        return acc;
    }, {});

    const sortedGroups = Object.keys(groupedNotes).sort((a, b) => {
        if (a === 'general') return -1;
        if (b === 'general') return 1;
        return groupedNotes[a].name.localeCompare(groupedGroups[b].name, 'hu');
    });

    if (sortedGroups.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Nincsenek jegyzetek a keresési feltételeknek megfelelően.</p>';
        return;
    }

    sortedGroups.forEach(patientId => {
        const group = groupedNotes[patientId];
        const groupElement = document.createElement('div');
        groupElement.className = 'patient-group';

        const heading = document.createElement('h3');
        heading.textContent = group.name;
        heading.style.color = group.color;
        heading.style.borderLeft = `3px solid ${group.color}`;
        heading.style.paddingLeft = '10px';
        groupElement.appendChild(heading);

        const sortedGroupNotes = group.notes.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedGroupNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-header">
                    <div>
                        <span class="note-date">${note.date}</span>
                        <button class="btn btn-delete" onclick="deleteNote(${note.id})" style="padding: 5px 10px; font-size: 12px;">Törlés</button>
                    </div>
                </div>
                <div>${note.content}</div>
            `;
            groupElement.appendChild(noteElement);
        });
        container.appendChild(groupElement);
    });
}

function deleteNote(id) {
    if (confirm('Biztosan törölni szeretné ezt a jegyzetet?')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
    }
}

// Data download functionality
function downloadAllData() {
    try {
        const allData = {
            patients: patients,
            shoppingItems: shoppingItems,
            documents: documents,
            notes: notes
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
        console.error('Hiba az adatok letöltésekor:', error);
    }
}

// Data upload functionality
if (uploadFile) {
    uploadFile.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

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

                renderPatients();
                renderShoppingList();
                renderDocuments();
                renderNotes();
                updatePatientSelects();
                generateCalendar();

                alert('Az adatok sikeresen feltöltve!');

            } catch (error) {
                console.error('Hiba a fájl feltöltésekor:', error);
                alert('Hiba a fájl feldolgozásakor. Kérjük, ellenőrizze, hogy a fájl érvényes JSON formátumú.');
            }
        };
        reader.readAsText(file);
    });
}
// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('A Service Worker regisztrációja sikertelen volt:', err);
    });
}

// Global variables for modal state
let isRenameMode = false;
let renameId = null;

// Helper function to convert total minutes back to "HH:MM" format
function minutesToTime(totalMinutes) {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Function to get current table data
function getTableData() {
    const rows = Array.from(document.querySelectorAll('#table-body tr')).map(row => {
        const inputs = row.querySelectorAll('input');
        return {
            name: inputs[0].value,
            gond1: inputs[1].value,
            gond2: inputs[2].value,
            gondUtazas: inputs[3].value
        };
    });
    return rows;
}

// Function to render the list of saved calculations
function renderSavedList() {
    const savedList = document.getElementById('saved-calculations-list');
    if (!savedList) return;
    savedList.innerHTML = ''; // Clear existing list

    const savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');

    if (savedData.length === 0) {
        savedList.innerHTML = '<p class="text-gray-500 text-center">Nincsenek mentett számítások.</p>';
        return;
    }

    savedData.forEach(item => {
        // IMPORTANT FIX: The data-id is moved to the outermost container of the list item
        const savedItemDiv = document.createElement('div');
        savedItemDiv.classList.add('flex', 'flex-col', 'sm:flex-row', 'items-center', 'justify-between', 'p-4', 'bg-gray-50', 'rounded-lg', 'shadow-sm', 'cursor-pointer', 'hover:bg-gray-100', 'transition-colors');
        savedItemDiv.dataset.id = item.id; // Corrected: data-id is now on the parent div
        
        savedItemDiv.innerHTML = `
            <div class="flex-grow w-full sm:w-auto mb-2 sm:mb-0">
                <p class="font-semibold text-gray-800">${item.name}</p>
                <p class="text-sm text-gray-500">Mentve: ${new Date(item.created).toLocaleString()}</p>
                <p class="text-sm text-gray-500">Utoljára szerkesztve: ${new Date(item.lastEdited).toLocaleString()}</p>
            </div>
            <div class="flex space-x-2">
                <button class="load-btn bg-blue-500 text-white px-3 py-1 text-sm rounded-full hover:bg-blue-600">Betöltés</button>
                <button class="rename-btn bg-gray-400 text-white px-3 py-1 text-sm rounded-full hover:bg-gray-500">Átnevez</button>
                <button class="delete-btn bg-red-500 text-white px-3 py-1 text-sm rounded-full hover:bg-red-600">Törlés</button>
            </div>
        `;
        savedList.appendChild(savedItemDiv);
    });
}

// Function to save the current table state
function saveCalculation(name) {
    const savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const now = new Date().toISOString();
    const id = `calc-${Date.now()}`;
    const newCalculation = {
        id: id,
        name: name,
        created: now,
        lastEdited: now,
        data: getTableData()
    };

    savedData.push(newCalculation);
    localStorage.setItem('savedCalculations', JSON.stringify(savedData));
    renderSavedList();
}

// Function to rename a saved calculation
function renameCalculation(id, newName) {
    const savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const itemToRename = savedData.find(item => item.id === id);

    if (itemToRename) {
        itemToRename.name = newName;
        itemToRename.lastEdited = new Date().toISOString();
        localStorage.setItem('savedCalculations', JSON.stringify(savedData));
        renderSavedList();
    }
}

// Function to load a saved calculation
function loadCalculation(id) {
    const savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const itemToLoad = savedData.find(item => item.id === id);
    const tableBody = document.getElementById('table-body');

    if (itemToLoad && tableBody) {
        tableBody.innerHTML = '';
        
        if (itemToLoad.data.length === 0) {
            for (let i = 1; i <= 12; i++) {
                tableBody.appendChild(createRow(''));
            }
            const messageBox = document.createElement('div');
            messageBox.textContent = 'A mentett számítás üres volt, az alapértelmezett sorok betöltve.';
            messageBox.classList.add('fixed', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2', 'bg-blue-500', 'text-white', 'p-4', 'rounded-lg', 'shadow-xl', 'z-50');
            document.body.appendChild(messageBox);
            setTimeout(() => document.body.removeChild(messageBox), 3000);
        } else {
            itemToLoad.data.forEach(rowData => {
                const newRow = createRow(rowData.name, rowData.gond1, rowData.gond2, rowData.gondUtazas);
                tableBody.appendChild(newRow);
            });
        }
        
        const now = new Date().toISOString();
        const itemIndex = savedData.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            savedData[itemIndex].lastEdited = now;
            localStorage.setItem('savedCalculations', JSON.stringify(savedData));
        }

        updateAllCalculations();
        renderSavedList();
    }
}

// Function to delete a saved calculation
function deleteCalculation(id) {
    let savedData = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    savedData = savedData.filter(item => item.id !== id);
    localStorage.setItem('savedCalculations', JSON.stringify(savedData));
    renderSavedList();
}

// Main function to perform all calculations and update the table
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

// Function to create a new table row with inputs and cells
function createRow(name = '', gond1 = '', gond2 = '', gondUtazas = '') {
    const newRow = document.createElement('tr');
    newRow.classList.add('hover:bg-gray-50');

    const rowContent = `
        <td class="p-3 text-sm text-gray-700 text-center border-b border-gray-200">
            <input type="text" class="bg-gray-100 rounded-lg p-1 text-center w-full" value="${name}">
        </td>
        <td class="p-3 text-sm text-gray-700 text-center border-b border-gray-200">
            <input type="number" class="number-input bg-gray-100 rounded-lg p-1 text-center gond1-input" value="${gond1}" min="0">
        </td>
        <td class="p-3 text-sm text-gray-700 text-center border-b border-gray-200">
            <input type="number" class="number-input bg-gray-100 rounded-lg p-1 text-center gond2-input" value="${gond2}" min="0">
        </td>
        <td class="p-3 text-sm text-gray-700 text-center border-b border-gray-200">
            <input type="number" class="number-input bg-gray-100 rounded-lg p-1 text-center gond-utazas-input" value="${gondUtazas}" min="0">
        </td>
        <td class="p-3 text-sm text-gray-700 text-center border-b border-gray-200 font-bold ora-perc-total">00:00 - 00:00</td>
    `;
    newRow.innerHTML = rowContent;
    
    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updateAllCalculations);
    });

    return newRow;
}

// Function to export table data to CSV
function exportToCsv() {
    const tableRows = document.querySelectorAll('#table-body tr');
    if (tableRows.length === 0) {
        const messageBox = document.createElement('div');
        messageBox.textContent = 'A táblázat üres. Nincs mit exportálni.';
        messageBox.classList.add('fixed', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2', 'bg-red-500', 'text-white', 'p-4', 'rounded-lg', 'shadow-xl', 'z-50');
        document.body.appendChild(messageBox);
        setTimeout(() => document.body.removeChild(messageBox), 3000);
        return;
    }

    const header = ['Név', 'Gondozási idő 1', 'Gondozási idő 2', 'Gond. idő + Utazás', 'Óra és perc'].join(';');
    const rows = Array.from(tableRows).map(row => {
        const rowData = [
            row.querySelector('td:first-child input').value,
            row.querySelector('.gond1-input').value,
            row.querySelector('.gond2-input').value,
            row.querySelector('.gond-utazas-input').value,
            row.querySelector('.ora-perc-total').textContent.trim()
        ];
        return rowData.join(';');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add UTF-8 BOM for Excel compatibility
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Kiszamolo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
