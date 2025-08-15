// Data storage
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let shoppingItems = JSON.parse(localStorage.getItem('shoppingItems')) || [];
let documents = JSON.parse(localStorage.getItem('documents')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];

// UI element references
const addPatientBtn = document.getElementById('addPatientBtn');
const patientFormContainer = document.getElementById('patientFormContainer');
const patientsTab = document.getElementById('patients');

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
}

// Show/hide patient form
addPatientBtn.addEventListener('click', () => {
    // Only toggle the form if the 'patients' tab is the active one
    if (patientsTab.classList.contains('active')) {
        patientFormContainer.classList.toggle('visible');
        addPatientBtn.classList.toggle('close');
        
        // Scroll to the form if it's visible
        if (patientFormContainer.classList.contains('visible')) {
             patientFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// Patient management
document.getElementById('patientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    
    if (!nameInput.value.trim()) {
        alert('Kérem, adja meg a páciens nevét.');
        nameInput.focus();
        return;
    }
    
    if (!phoneInput.value.trim()) {
        alert('Kérem, adja meg a telefonszámot.');
        phoneInput.focus();
        return;
    }
    
    const visitDays = [];
    const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked');
    dayCheckboxes.forEach(checkbox => {
        visitDays.push(parseInt(checkbox.value));
    });

    const patient = {
        id: Date.now(),
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
        createdDate: new Date().toISOString()
    };

    console.log('Páciens hozzáadása:', patient); 
    
    try {
        patients.push(patient);
        localStorage.setItem('patients', JSON.stringify(patients));
        
        const saved = JSON.parse(localStorage.getItem('patients'));
        console.log('Páciensek elmentve a helyi tárolóba:', saved); 
        
        renderPatients();
        updatePatientSelects();
        generateCalendar();
        clearForm();
        
        alert(`A páciens, ${patient.name}, sikeresen hozzá lett adva!`);
        
    } catch (error) {
        console.error('Hiba a páciens mentésekor:', error);
        alert('Hiba a páciens mentésekor. Kérem, próbálja újra.');
    }
});

function renderPatients() {
    const container = document.getElementById('patientsList');
    container.innerHTML = '';

    console.log('Páciensek renderelése:', patients); 

    if (patients.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Még nincsenek hozzáadott páciensek. Használja a fenti űrlapot az első páciens hozzáadásához.</p>';
        return;
    }

    patients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.style.borderLeftColor = patient.color || '#667eea';
        
        const visitDaysText = getVisitDaysText(patient.visitDays || []);
        
        card.innerHTML = `
            <div class="patient-name">${patient.name}</div>
            <p><strong>Telefonszám:</strong> ${patient.phone}</p>
            <p><strong>Cím:</strong> ${patient.address || 'Nincs megadva'}</p>
            <p><strong>Kapukód:</strong> ${patient.intercom || 'Nincs megadva'}</p>
            <p><strong>TAJ:</strong> ${patient.taj || 'Nincs megadva'}</p>
            <p><strong>Értesítendő:</strong> ${patient.emergencyContact || 'Nincs megadva'}</p>
            <p><strong>Értesítendő telefonszáma:</strong> ${patient.emergencyPhone || 'Nincs megadva'}</p>
            <p><strong>Feladatok:</strong> ${patient.tasks || 'Nincs megadva'}</p>
            <p><strong>Látogatási napok:</strong> ${visitDaysText}</p>
            <div style="margin-top: 15px;">
                <button class="btn btn-call" onclick="callPatient('${patient.phone}')">📞 Hívás</button>
                <button class="btn" onclick="editPatient(${patient.id})">Szerkesztés</button>
                <button class="btn btn-delete" onclick="deletePatient(${patient.id})">Törlés</button>
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
        alert('Páciens sikeresen törölve!');
    }
}

function clearForm() {
    document.getElementById('patientForm').reset();
    
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById('patientColor').value = '#667eea';
    
    console.log('Űrlap törölve'); 
    
    // Hide the form after clearing
    patientFormContainer.classList.remove('visible');
    addPatientBtn.classList.remove('close');
}

function editPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    document.getElementById('name').value = patient.name;
    document.getElementById('phone').value = patient.phone;
    document.getElementById('address').value = patient.address || '';
    document.getElementById('intercom').value = patient.intercom || '';
    document.getElementById('taj').value = patient.taj || '';
    document.getElementById('emergencyContact').value = patient.emergencyContact || '';
    document.getElementById('emergencyPhone').value = patient.emergencyPhone || '';
    document.getElementById('tasks').value = patient.tasks || '';
    document.getElementById('patientColor').value = patient.color || '#667eea';
    
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = patient.visitDays && patient.visitDays.includes(parseInt(checkbox.value));
    });
    
    patients = patients.filter(p => p.id !== id);
    localStorage.setItem('patients', JSON.stringify(patients));
    
    document.getElementById('patientForm').scrollIntoView({ behavior: 'smooth' });
    
    alert('Páciens betöltve szerkesztésre. Frissítse az adatokat, és kattintson a "Mentés" gombra a változások mentéséhez.');
}

function updatePatientSelects() {
    const selects = ['shoppingPatient', 'documentPatient', 'notePatient'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
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
    const now = new Date();
    document.getElementById('calendarMonth').value = now.getMonth();
    document.getElementById('calendarYear').value = now.getFullYear();
    
    document.getElementById('calendarMonth').addEventListener('change', generateCalendar);
    document.getElementById('calendarYear').addEventListener('change', generateCalendar);
}

function generateCalendar() {
    const month = parseInt(document.getElementById('calendarMonth').value);
    const year = parseInt(document.getElementById('calendarYear').value);
    
    if (isNaN(month) || isNaN(year)) return;
    
    const calendar = document.getElementById('calendarGrid');
    calendar.innerHTML = '';
    
    // Updated day header to start with Monday
    const days = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Correctly calculate the starting day for a Monday-based calendar
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    // Adjust for Monday being day 1 and Sunday being day 0
    if (dayOfWeek === 0) dayOfWeek = 7;
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (dayOfWeek - 1)); // Adjust to start on the correct Monday
    
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
        
        const dayOfWeekForVisit = currentDate.getDay(); // 0 for Sunday, 1 for Monday...
        let visitDayValue = dayOfWeekForVisit;
        // The checkboxes are set up for Monday to Friday (values 1 to 5), so no change needed here.
        // If your checkboxes were different, you would need to adjust this.
        
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

function renderShoppingList() {
    const container = document.getElementById('shoppingList');
    container.innerHTML = '';
    
    shoppingItems.forEach(item => {
        const patient = patients.find(p => p.id == item.patientId);
        const patientName = patient ? patient.name : 'Általános';
        
        const itemElement = document.createElement('div');
        itemElement.className = 'shopping-item';
        itemElement.innerHTML = `
            <div>
                <strong>${item.item}</strong>
                <div style="font-size: 14px; color: #718096;">Páciens: ${patientName}</div>
            </div>
            <button class="btn btn-delete" onclick="deleteShoppingItem(${item.id})">Eltávolítás</button>
        `;
        
        const listElement = document.createElement('div');
        listElement.className = 'shopping-list';
        listElement.appendChild(itemElement);
        container.appendChild(listElement);
    });
}

function deleteShoppingItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
}

// Document management
document.getElementById('documentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('documentFile');
    const file = fileInput.files[0];
    const patientId = document.getElementById('documentPatient').value;
    
    if (!file) {
        alert('Kérem, válasszon egy fájlt a feltöltéshez.');
        return;
    }
    
    if (!patientId) {
        alert('Kérem, válasszon egy pácienst ehhez a dokumentumhoz.');
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
            
            alert('Dokumentum sikeresen feltöltve!');
        } catch (error) {
            console.error('Hiba a dokumentum mentésekor:', error);
            alert('Hiba a dokumentum feltöltésekor. Kérem, próbálja újra.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };
    
    reader.onerror = function() {
        alert('Hiba a fájl olvasásakor. Kérem, próbálja újra.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    };
    
    reader.readAsDataURL(file);
});

function renderDocuments() {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';
    
    if (documents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Még nincsenek feltöltött dokumentumok.</p>';
        return;
    }
    
    const sortedDocs = [...documents].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedDocs.forEach(doc => {
        const patient = patients.find(p => p.id == doc.patientId);
        const patientName = patient ? patient.name : 'Ismeretlen páciens';
        
        const fileSize = doc.size ? formatFileSize(doc.size) : 'Ismeretlen méret';
        
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        docElement.innerHTML = `
            <div>
                <strong>${doc.name}</strong>
                <div style="font-size: 14px; color: #718096;">
                    Páciens: ${patientName} | Méret: ${fileSize} | Feltöltve: ${doc.uploadDate}
                </div>
            </div>
            <div>
                <button class="btn" onclick="viewDocument(${doc.id})">Megtekintés</button>
                <button class="btn" onclick="downloadDocument(${doc.id})">Letöltés</button>
                <button class="btn btn-delete" onclick="deleteDocument(${doc.id})">Törlés</button>
            </div>
        `;
        
        container.appendChild(docElement);
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

function renderNotes() {
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    
    const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedNotes.forEach(note => {
        const patient = patients.find(p => p.id == note.patientId);
        const patientName = patient ? patient.name : 'Általános';
        
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-header">
                <strong>Jegyzet a következőhöz: ${patientName}</strong>
                <div>
                    <span class="note-date">${note.date}</span>
                    <button class="btn btn-delete" onclick="deleteNote(${note.id})" style="padding: 5px 10px; font-size: 12px;">Törlés</button>
                </div>
            </div>
            <div>${note.content}</div>
        `;
        
        container.appendChild(noteElement);
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
