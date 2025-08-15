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
});

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Show/hide floating button based on the active tab
    if (tabName === 'patients') {
        addPatientBtn.style.display = 'block';
    } else {
        addPatientBtn.style.display = 'none';
        // Hide the form if a different tab is selected
        patientFormContainer.classList.remove('visible');
        addPatientBtn.classList.remove('close');
    }

    if (tabName === 'calendar') {
        generateCalendar();
    }
    // Re-render lists with search queries when switching back to their tabs
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

// Show/hide patient form
if (addPatientBtn) {
    addPatientBtn.addEventListener('click', () => {
        if (patientsTab.classList.contains('active')) {
            // If form is visible, close it. Otherwise, open it.
            if (patientFormContainer.classList.contains('visible')) {
                patientFormContainer.classList.remove('visible');
                addPatientBtn.classList.remove('close');
                clearForm(); // Reset fields, remove buttons
            } else {
                patientToEdit = null;
                clearForm(); // Reset fields, ensure default buttons
                patientFormContainer.classList.add('visible');
                addPatientBtn.classList.add('close');
                patientFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
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
            // Replaced alert with a more user-friendly UI indication
            nameInput.reportValidity();
            nameInput.focus();
            return;
        }
        
        if (!phoneInput.value.trim()) {
            // Replaced alert with a more user-friendly UI indication
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
                // Editing existing patient
                const patientIndex = patients.findIndex(p => p.id === patientToEdit.id);
                if (patientIndex !== -1) {
                    patients[patientIndex] = patientData;
                    // Removed success alert
                }
            } else {
                // Adding new patient
                patients.push(patientData);
                // Removed success alert
            }
            
            localStorage.setItem('patients', JSON.stringify(patients));
            
            renderPatients();
            updatePatientSelects();
            generateCalendar();
            clearForm();
            patientToEdit = null; // Clear patient in edit mode
            
            // Close the form on successful save
            patientFormContainer.classList.remove('visible');
            addPatientBtn.classList.remove('close');
            
        } catch (error) {
            console.error('Hiba a páciens mentésekor:', error);
            // Replaced alert with a console error or a more subtle UI message if needed
        }
    });
}


function renderPatients(searchQuery = '') {
    const container = document.getElementById('patientsList');
    if (!container) return;
    container.innerHTML = '';
    
    // Sort patients alphabetically by name
    const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    
    // Filter patients based on search query
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
            <p><strong>Értesítendő telefonszáma:</strong> ${patient.emergencyPhone || 'Nincs megadva'}</p>
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
    if (confirm(`Biztosan törölni szeretné ${patient ? patient.name : 'ezt a pácienst'}?`)) {
        patients = patients.filter(p => p.id !== id);
        localStorage.setItem('patients', JSON.stringify(patients));
        renderPatients();
        updatePatientSelects();
        generateCalendar();
        clearForm(); // Clear the form and remove the delete button
        // Removed success alert
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
    
    // This part is now handled by the event listener that calls this function.
}

function editPatient(id) {
    patientToEdit = patients.find(p => p.id === id);
    if (!patientToEdit) return;
    
    // Reset the form to clear any previous state
    clearForm();

    // Populate the form with patient data
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
    
    // Change the form buttons for editing
    const submitBtn = patientForm.querySelector('.btn[type="submit"]');
    submitBtn.textContent = 'Frissítés';
    
    // Create and add the "Mégse" button
    const existingCancelBtn = patientForm.querySelector('.btn-cancel');
    if (existingCancelBtn) existingCancelBtn.remove();

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Mégse';
    cancelBtn.type = 'button';
    cancelBtn.onclick = () => {
        // This is a crucial fix: it now explicitly hides the form
        patientFormContainer.classList.remove('visible');
        addPatientBtn.classList.remove('close');
        clearForm();
        patientToEdit = null;
    };
    submitBtn.insertAdjacentElement('afterend', cancelBtn);
    
    showDeleteButton(id);
    
    patientFormContainer.classList.add('visible');
    addPatientBtn.classList.add('close');
    patientFormContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Removed alert
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
            patientId: document.getElementById('shoppingPatient').value,
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
        (patients.find(p => p.id == item.patientId)?.name.toLowerCase().includes(query))
    );
    
    const groupedItems = filteredItems.reduce((acc, item) => {
        const patient = patients.find(p => p.id == item.patientId);
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
            // Replaced alert with a more user-friendly UI indication
            fileInput.reportValidity();
            return;
        }
        
        if (!patientId) {
            // Replaced alert with a more user-friendly UI indication
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
                
                // Removed success alert
            } catch (error) {
                console.error('Hiba a dokumentum mentésekor:', error);
                // Replaced alert with a console error or a more subtle UI message if needed
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        };
        
        reader.onerror = function() {
            // Replaced alert with a console error or a more subtle UI message if needed
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
        (patients.find(p => p.id == doc.patientId)?.name.toLowerCase().includes(query))
    );
    
    const groupedDocs = filteredDocs.reduce((acc, doc) => {
        const patient = patients.find(p => p.id == doc.patientId);
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
            patientId: document.getElementById('notePatient').value,
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
        (patients.find(p => p.id == note.patientId)?.name.toLowerCase().includes(query))
    );

    const groupedNotes = filteredNotes.reduce((acc, note) => {
        const patient = patients.find(p => p.id == note.patientId);
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
        return groupedNotes[a].name.localeCompare(groupedNotes[b].name, 'hu');
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

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('A Service Worker regisztrációja sikertelen volt:', err);
    });
}
