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
let isRenameMode = null;
let renameId = null;

// New global variable to track the date of the loaded calculation
let currentCalculationDate = null;
let cameraStream = null;
let currentlyOpenSwipeItem = null;

const themeKey = 'app-theme';
const NOTE_COLORS = ["#b3ffb3", "#ffb3e6", "#b39b9b", "#ffcc99", "#b3e6ff", "#66e6d6"];
let colorIndex = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();

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

    // On page load, explicitly sync calendar data for today to ensure it's always visible
    const today = new Date().toISOString();
    syncCalculatorToCalendar(today);

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
    const closeGeminiMainModalBtn = document.getElementById('closeGeminiMainModal');
    const geminiMainModal = document.getElementById('geminiMainModal');


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
    const deletePatientBtn = document.getElementById('deletePatientBtn');

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
    
    if (deletePatientBtn) {
        deletePatientBtn.addEventListener('click', () => {
            if (patientToEdit) {
                deletePatient(patientToEdit.id);
            }
        });
    }

    // Camera Modal
    const cameraModal = document.getElementById('cameraModal');
    if (cameraModal) {
        cameraModal.addEventListener('click', (e) => {
            if (e.target === cameraModal) {
                stopCamera();
            }
        });
    }

    // Main Gemini Modal
    if (closeGeminiMainModalBtn) {
        closeGeminiMainModalBtn.addEventListener('click', closeGeminiMainModal);
    }

    if (geminiMainModal) {
        geminiMainModal.addEventListener('click', (e) => {
            if (e.target === geminiMainModal) {
                closeGeminiMainModal();
            }
        });
    }


    // Gemini confirmation modal
    const geminiConfirmModal = document.getElementById('geminiConfirmModal');
    if (geminiConfirmModal) {
        geminiConfirmModal.addEventListener('click', (e) => {
            if (e.target === geminiConfirmModal) {
                closeGeminiConfirmModal();
            }
        });
    }
    
    const confirmBtn = document.getElementById('geminiConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            addConfirmedItemsToShoppingList();
            closeGeminiConfirmModal();
        });
    }

    const cancelGeminiBtn = document.getElementById('geminiCancelBtn');
    if (cancelGeminiBtn) {
        cancelGeminiBtn.addEventListener('click', () => {
            closeGeminiConfirmModal();
        });
    }

    // Document popup modal
    const popupOverlay = document.getElementById('popupOverlay');
    if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closeDocumentPopup();
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

function openSwipeItem(element) {
    const actionWidth = element.nextElementSibling.offsetWidth;
    element.style.transform = `translateX(-${actionWidth}px)`;
    currentlyOpenSwipeItem = element;
}

function closeSwipeItem(element) {
    element.style.transform = 'translateX(0)';
    if (currentlyOpenSwipeItem === element) {
        currentlyOpenSwipeItem = null;
    }
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

function openGeminiMainModal() {
    const modal = document.getElementById('geminiMainModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeGeminiMainModal() {
    const modal = document.getElementById('geminiMainModal');
    if (modal) {
        modal.classList.remove('show');
        // Clear any previous state
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('analyzeBtn').classList.add('hidden');
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('uploadImageFile').value = '';
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

function openGeminiConfirmModal(items, patientId) {
    const modal = document.getElementById('geminiConfirmModal');
    const listContainer = document.getElementById('geminiItemsList');
    const patientName = patients.find(p => p.id === parseInt(patientId))?.name || 'Általános';
    const patientSpan = document.getElementById('geminiPatientName');

    if (!modal || !listContainer) return;

    listContainer.innerHTML = '';
    
    if (patientSpan) {
        patientSpan.textContent = patientName;
        modal.dataset.patientId = patientId;
    }

    items.forEach(itemText => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gemini-list-item-editable';
        itemDiv.innerHTML = `
            <input type="text" value="${itemText}" class="gemini-item-input flex-1 p-2 border rounded-lg">
            <button class="icon-btn btn-danger remove-item-btn"><i class="fas fa-trash"></i></button>
        `;
        listContainer.appendChild(itemDiv);

        // Add event listener for the remove button
        itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => {
            itemDiv.remove();
        });
    });

    modal.classList.add('show');
}

function closeGeminiConfirmModal() {
    const modal = document.getElementById('geminiConfirmModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function openDocumentPopup(doc) {
    const popupOverlay = document.getElementById('popupOverlay');
    const popupTitle = document.getElementById('file-name');
    const popupDate = document.getElementById('popup-date');
    const popupPatient = document.getElementById('popup-patient');
    const popupSize = document.getElementById('popup-size');
    const editInput = document.getElementById('edit-input');
    const deleteBtn = document.getElementById('delete-doc-btn').parentElement;
    const viewBtn = document.getElementById('view-doc-btn');
    const downloadBtn = document.getElementById('download-doc-btn');

    if (!doc || !popupOverlay) return;
    
    const patient = patients.find(p => p.id === doc.patientId);
    const patientName = patient ? patient.name : 'Ismeretlen';
    const formattedDate = formatCustomDate(doc.uploadDate);

    // Set popup content
    popupTitle.textContent = doc.name;
    editInput.value = doc.name;
    popupDate.textContent = formattedDate;
    popupPatient.textContent = patientName;
    popupSize.textContent = formatFileSize(doc.size);
    
    // Set data attributes for event listeners
    popupOverlay.dataset.docId = doc.id;
    popupOverlay.dataset.docName = doc.name;

    // Reset UI state
    popupTitle.classList.remove('hidden');
    editInput.classList.add('hidden');

    // Add event listeners for the specific document
    deleteBtn.onclick = () => deleteDocument(doc.id);
    viewBtn.onclick = () => viewDocument(doc.id);
    downloadBtn.onclick = () => downloadDocument(doc.id);
    
    popupTitle.onclick = () => {
        popupTitle.classList.add('hidden');
        editInput.classList.remove('hidden');
        editInput.focus();
    };

    editInput.onblur = () => saveDocumentTitle(doc.id, editInput.value);
    editInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            saveDocumentTitle(doc.id, editInput.value);
        }
    };
    
    popupOverlay.style.display = 'flex';
}

function closeDocumentPopup() {
    const popupOverlay = document.getElementById('popupOverlay');
    if (popupOverlay) {
        popupOverlay.style.display = 'none';
        document.getElementById('file-name').classList.remove('hidden');
        document.getElementById('edit-input').classList.add('hidden');
    }
}

function saveDocumentTitle(docId, newTitle) {
    const docToUpdate = documents.find(d => d.id === docId);
    if (docToUpdate) {
        docToUpdate.name = newTitle;
        localStorage.setItem('documents', JSON.stringify(documents));
        renderDocuments();
    }
    closeDocumentPopup();
}

function formatCustomDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}


// Event Listeners
function initializeEventListeners() {
    const themeToggleDesktop = document.getElementById('theme-toggle-desktop');
    if (themeToggleDesktop) {
        themeToggleDesktop.addEventListener('click', toggleTheme);
    }
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', toggleTheme);
    }

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

    // New document upload listeners
    const dropArea = document.getElementById('drop-area');
    const fileBtn = document.getElementById('file-btn');
    const fileInput = document.getElementById('documentFile');
    const documentPatientSelect = document.getElementById('documentPatient');

    if (fileBtn) {
        fileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleDocumentFiles(e.target.files);
        });
    }

    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('border-purple-500');
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('border-purple-500');
            }, false);
        });
        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleDocumentFiles(files);
        }, false);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDocumentFiles(files) {
        const patientId = documentPatientSelect.value;
        if (!patientId) {
            showCustomMessage('Kérjük, válasszon ki egy pácienst a feltöltéshez.', 'error');
            return;
        }

        const uploadMessage = document.getElementById('upload-message');
        uploadMessage.textContent = 'Feltöltés folyamatban...';
        uploadMessage.classList.remove('hidden');

        const formData = new FormData();
        formData.append('patientId', patientId);
        
        // Append all files to the same FormData object
        for (const file of files) {
            formData.append('documentFile', file);
        }

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Fájl feltöltése sikertelen.') });
            }
            return response.json();
        })
        .then(result => {
            if (result.document) {
                documents.push(result.document);
                localStorage.setItem('documents', JSON.stringify(documents));
            }
            renderDocuments();
            fileInput.value = '';
            uploadMessage.classList.add('hidden');
        })
        .catch(error => {
            console.error('Fájl feltöltési hiba:', error);
            showCustomMessage(`Hiba: ${error.message}`, 'error');
            uploadMessage.classList.add('hidden');
        });
    }
    
    const notePatientSelect = document.getElementById('notePatient');
    const addNoteBtn = document.getElementById('addNoteBtn');

    if (notePatientSelect) {
        notePatientSelect.addEventListener('change', () => {
            // Show the "+" button when a patient is selected
            if (notePatientSelect.value) {
                addNoteBtn.classList.remove('hidden');
            } else {
                addNoteBtn.classList.add('hidden');
            }
            renderNotes();
        });
    }

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', createNewNote);
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

    // Gemini API features for shopping list
    const openGeminiModalBtn = document.getElementById('openGeminiModalBtn');
    const uploadImageFile = document.getElementById('uploadImageFile');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const openCameraBtn = document.getElementById('openCameraBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (openGeminiModalBtn) {
        openGeminiModalBtn.addEventListener('click', openGeminiMainModal);
    }

    if (uploadImageBtn) {
        uploadImageBtn.addEventListener('click', () => {
            uploadImageFile.click();
        });
    }

    if (uploadImageFile) {
        uploadImageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    const imagePreview = document.getElementById('imagePreview');
                    imagePreview.src = imageData;
                    imagePreview.classList.remove('hidden');
                    analyzeBtn.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (openCameraBtn) {
        openCameraBtn.addEventListener('click', startCamera);
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            const imagePreview = document.getElementById('imagePreview');
            const patientSelect = document.getElementById('geminiPatientSelect');
            const patientId = patientSelect.value;
            if (imagePreview.src && patientId) {
                analyzeImageWithGemini(imagePreview.src, patientId);
            } else {
                // Using a custom modal instead of alert
                showCustomMessage('Kérjük, válasszon ki egy képet és egy pácienst.', 'alert');
            }
        });
    }

    // Camera modal buttons
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const cancelPhotoBtn = document.getElementById('cancelPhotoBtn');
    if (takePhotoBtn) {
        takePhotoBtn.addEventListener('click', capturePhoto);
    }
    if (cancelPhotoBtn) {
        cancelPhotoBtn.addEventListener('click', stopCamera);
    }

    // Note Settings Pop-up listener
    document.addEventListener('click', (e) => {
        const noteSettingsPopup = document.getElementById('noteSettingsPopup');
        // Close if click is outside popup AND not on any settings button
        const isSettingsButton = e.target.closest('.settings-btn');
        if (noteSettingsPopup.classList.contains('show') && !noteSettingsPopup.contains(e.target) && !isSettingsButton) {
            noteSettingsPopup.classList.remove('show');
        }

        // Close open swipe item if clicking outside of it
        if (currentlyOpenSwipeItem && !currentlyOpenSwipeItem.parentElement.contains(e.target)) {
            closeSwipeItem(currentlyOpenSwipeItem);
        }
    });

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
        birthdate: document.getElementById('birthdate').value.trim(),
        birthplace: document.getElementById('birthplace').value.trim(),
        mothersName: document.getElementById('mothersName').value.trim(),
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

        // Format birth date
        const formattedBirthdate = patient.birthdate ? patient.birthdate.split('-').join('/') : 'Nincs megadva';

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
                    <span class="patient-info-label">Cím:</span>
                    <span class="patient-info-value">${patient.address || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Kapukód:</span>
                    <span class="patient-info-value">${patient.intercom || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Születési hely:</span>
                    <span class="patient-info-value">${patient.birthplace || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Születési idő:</span>
                    <span class="patient-info-value">${formattedBirthdate}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Anyja neve:</span>
                    <span class="patient-info-value">${patient.mothersName || 'Nincs megadva'}</span>
                </div>
                <div class="patient-info-item">
                    <span class="patient-info-label">Telefonszám:</span>
                    <span class="patient-info-value">${patient.phone}</span>
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
    document.getElementById('birthdate').value = patientToEdit.birthdate || '';
    document.getElementById('birthplace').value = patientToEdit.birthplace || '';
    document.getElementById('mothersName').value = patientToEdit.mothersName || '';
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
    // Use a custom confirmation modal instead of alert/confirm
    showCustomConfirm(`Biztosan törölni szeretné ${patient ? patient.name : 'ezt a pácienst'}? Ez az akció visszavonhatatlan és minden hozzá kapcsolódó adatot töröl.`, () => {
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
        showCustomMessage('A páciens sikeresen törölve.', 'success');
    });
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
    const selects = ['shoppingPatient', 'documentPatient', 'notePatient', 'geminiPatientSelect'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;

        // Clear existing options
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Sort patients alphabetically
        const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'hu'));

        sortedPatients.forEach(patient => {
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
    const patientSelects = document.querySelectorAll('.patient-select');
    patientSelects.forEach(select => {
        const currentValue = select.value;
        // Sort patients alphabetically
        const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
        const optionsHTML = sortedPatients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
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
        const visitDayString = visitDate.toISOString().split('T')[0];
        return visitDayString === date.toISOString().split('T')[0];
    });
}

// Shopping list functionality
function handleShoppingSubmit(e) {
    e.preventDefault();

    const newItemName = document.getElementById('shoppingItem').value.trim();
    const patientId = parseInt(document.getElementById('shoppingPatient').value);

    if (!newItemName || !patientId) {
        showCustomMessage('Kérjük, adjon meg egy tételt és válasszon pácienst.', 'error');
        return;
    }

    const existingItem = shoppingItems.find(item => item.item.toLowerCase() === newItemName.toLowerCase() && item.patientId === patientId);

    if (existingItem) {
        if (existingItem.completed) {
            existingItem.completed = false;
        }
    } else {
        const newItem = {
            id: Date.now(),
            item: newItemName,
            patientId: patientId,
            completed: false
        };
        shoppingItems.push(newItem);
    }

    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
    document.getElementById('shoppingForm').reset();
}


function renderShoppingList(searchQuery = '') {
    const container = document.getElementById('shoppingList');
    if (!container) return;
    renderGroupedItems(shoppingItems, 'shoppingList', createShoppingListItem, searchQuery, 'shopping-list-container');
}

function createShoppingListItem(item) {
    const listItem = document.createElement('li');
    listItem.className = 'shopping-list-item-swipe-container';

    const contentDiv = document.createElement('div');
    contentDiv.className = `shopping-list-item ${item.completed ? 'completed' : ''}`;

    const patient = patients.find(p => p.id === item.patientId);
    if (patient) {
        contentDiv.style.borderLeftColor = patient.color;
    }

    contentDiv.innerHTML = `
        <input type="checkbox" class="item-checkbox" ${item.completed ? 'checked' : ''} data-id="${item.id}">
        <input type="text" class="item-name" value="${item.item}" data-id="${item.id}">
        <div class="shopping-item-actions-desktop">
            <button class="icon-btn btn-danger" onclick="deleteShoppingItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'shopping-item-actions-swipe';
    actionsDiv.innerHTML = `
        <button class="icon-btn btn-danger" onclick="deleteShoppingItem(${item.id})">
            <i class="fas fa-trash"></i>
        </button>
    `;

    listItem.appendChild(contentDiv);
    listItem.appendChild(actionsDiv);

    contentDiv.querySelector('.item-checkbox').addEventListener('change', (e) => {
        toggleShoppingItemCompletion(item.id, e.target.checked);
    });

    contentDiv.querySelector('.item-name').addEventListener('blur', (e) => {
        updateShoppingItemName(item.id, e.target.value);
    });

    // --- Swipe Logic for Mobile ---
    let startX = 0, startY = 0;
    let currentX = 0;
    let isDragging = false;
    let isSwiping = false;
    const threshold = -50; // Min swipe distance to trigger open

    contentDiv.addEventListener('touchstart', (e) => {
        if (currentlyOpenSwipeItem && currentlyOpenSwipeItem !== contentDiv) {
            closeSwipeItem(currentlyOpenSwipeItem);
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        isDragging = true;
        isSwiping = false;
        contentDiv.style.transition = 'none';
    }, { passive: true });

    contentDiv.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        currentX = e.touches[0].clientX;
        let diffX = currentX - startX;

        if (!isSwiping) {
            let diffY = e.touches[0].clientY - startY;
            if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
                isSwiping = true;
            } else if (Math.abs(diffY) > 10) {
                isDragging = false; // It's a vertical scroll
                return;
            }
        }

        if (isSwiping && diffX < 0) {
            const actionWidth = 70;
            let transX = diffX;
            if (diffX < -actionWidth) {
                // Add resistance for over-swiping
                const overscroll = -actionWidth + (diffX + actionWidth) * 0.4;
                transX = overscroll;
            }
            contentDiv.style.transform = `translateX(${transX}px)`;
        }
    });

    contentDiv.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        contentDiv.style.transition = 'transform 0.3s ease';
        const diffX = currentX - startX;

        if (isSwiping) {
            if (diffX < threshold) {
                openSwipeItem(contentDiv);
            } else {
                closeSwipeItem(contentDiv);
            }
        }
    });

    return listItem;
}

function updateShoppingItemName(id, newName) {
    const itemToUpdate = shoppingItems.find(item => item.id === id);
    if (itemToUpdate) {
        itemToUpdate.item = newName.trim();
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        renderShoppingList();
    }
}

function toggleShoppingItemCompletion(id, isCompleted) {
    const itemToUpdate = shoppingItems.find(item => item.id === id);
    if (itemToUpdate) {
        itemToUpdate.completed = isCompleted;
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        renderShoppingList();
    }
}

function deleteShoppingItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
}

// Document management
function renderDocuments(searchQuery = '') {
    const container = document.querySelector('.documents-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const query = searchQuery.toLowerCase();
    
    const filteredDocuments = documents.filter(doc => {
        const patient = patients.find(p => p.id === doc.patientId);
        const patientName = patient ? patient.name : 'Általános';
        return doc.name.toLowerCase().includes(query) || patientName.toLowerCase().includes(query);
    });

    if (filteredDocuments.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek dokumentumok a keresési feltételeknek megfelelően.</div>';
        return;
    }

    filteredDocuments.forEach(doc => {
        const docTitle = doc.name.length > 20 ? doc.name.substring(0, 20) + '...' : doc.name;
        // Format the date here
        const formattedDate = formatCustomDate(doc.uploadDate);
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.innerHTML = `
            <div class="doc-left">
                <div class="doc-icon">📄</div>
                <div class="doc-text">
                    <div class="doc-title" title="${doc.name}">${docTitle}</div>
                    <div class="doc-meta">Feltöltve: ${formattedDate}</div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openDocumentPopup(doc));
        container.appendChild(card);
    });
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
    // Use a custom confirmation modal instead of alert/confirm
    showCustomConfirm('Biztosan törölni szeretné ezt a dokumentumot?', () => {
        documents = documents.filter(d => d.id !== id);
        localStorage.setItem('documents', JSON.stringify(documents));
        renderDocuments();
        closeDocumentPopup();
    });
}

// Notes functionality
function createNewNote() {
    const patientSelect = document.getElementById('notePatient');
    const patientId = patientSelect.value;
    
    if (!patientId) {
        showCustomMessage('Kérjük, válasszon ki egy pácienst a jegyzet létrehozásához.', 'error');
        return;
    }

    const newNote = {
        id: Date.now(),
        title: 'Új jegyzet',
        content: '',
        patientId: parseInt(patientId),
        color: NOTE_COLORS[colorIndex],
        isPinned: false,
    };
    
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
    
    // Cycle to the next color for the next note
    colorIndex = (colorIndex + 1) % NOTE_COLORS.length;
}

function renderNotes(searchQuery = '') {
    const container = document.getElementById('notesList');
    const patientSelect = document.getElementById('notePatient');
    const selectedPatientId = patientSelect.value;
    const query = searchQuery.toLowerCase();

    if (!container) return;
    
    // Clear previous notes
    container.innerHTML = '';
    
    if (!selectedPatientId) {
        container.innerHTML = '<div class="empty-state">Kérjük, válasszon ki egy pácienst a jegyzetek megtekintéséhez.</div>';
        return;
    }

    const patientNotes = notes.filter(note => 
        String(note.patientId) === selectedPatientId && note.content.toLowerCase().includes(query)
    );

    // Separate pinned and unpinned notes
    const pinnedNotes = patientNotes.filter(note => note.isPinned);
    const unpinnedNotes = patientNotes.filter(note => !note.isPinned);

    // Sort pinned notes by timestamp (newest first)
    pinnedNotes.sort((a, b) => (b.pinnedTimestamp || 0) - (a.pinnedTimestamp || 0));

    // Sort unpinned notes by creation id (newest first)
    unpinnedNotes.sort((a, b) => b.id - a.id);

    if (patientNotes.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek jegyzetek ehhez a pácienshez. Kattintson a "+" gombra egy új hozzáadásához.</div>';
    } else {
        // Render pinned notes
        pinnedNotes.forEach(note => {
            const card = createNoteCard(note);
            container.appendChild(card);
        });

        // Add a divider if there are both pinned and unpinned notes
        if (pinnedNotes.length > 0 && unpinnedNotes.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'notes-divider';
            divider.innerHTML = `
                <span class="notes-divider-line"></span>
                <span class="notes-divider-text">Többi jegyzet</span>
                <span class="notes-divider-line"></span>
            `;
            container.appendChild(divider);
        }

        // Render unpinned notes
        unpinnedNotes.forEach(note => {
            const card = createNoteCard(note);
            container.appendChild(card);
        });
    }
}

function createNoteCard(note) {
    const patient = patients.find(p => p.id === note.patientId);
    const patientColor = patient ? patient.color : '#8b5cf6';
    const card = document.createElement('div');
    
    // Add a random slight rotation for visual effect, only if not pinned
    const randomRotation = note.isPinned ? 0 : (Math.random() - 0.5) * 4; // -2deg to 2deg
    
    card.className = `note-sticky ${note.isPinned ? 'pinned' : ''}`;
    card.style.borderLeftColor = patientColor;
    card.style.setProperty('--rotation', `${randomRotation}deg`); // Apply rotation
    
    const contentClass = note.content.trim() ? '' : 'empty';

    card.innerHTML = `
        <div class="note-sticky-background"></div>
        <div class="note-sticky-header">
            <h4 class="note-sticky-title" contenteditable="true" data-id="${note.id}" spellcheck="false">${note.title || 'Jegyzet'}</h4>
            <div class="card-actions">
                <button class="icon-btn pin-btn ${note.isPinned ? 'active' : ''}" data-id="${note.id}" title="Rögzítés">
                    <i class="fas fa-thumbtack"></i>
                </button>
                <button class="icon-btn settings-btn" data-id="${note.id}" title="Beállítások">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </div>
        <div class="note-sticky-content">
            <div class="note-sticky-text ${contentClass}" contenteditable="true" data-id="${note.id}" spellcheck="false">${note.content}</div>
        </div>
    `;

    // Set the background color on the dedicated background element
    const backgroundElement = card.querySelector('.note-sticky-background');
    if (backgroundElement) {
        backgroundElement.style.backgroundColor = note.color;
    }

    const noteTitleElement = card.querySelector('.note-sticky-title');
    noteTitleElement.addEventListener('blur', (e) => saveNoteTitle(e.target.dataset.id, e.target.textContent));
    noteTitleElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    const noteTextElement = card.querySelector('.note-sticky-text');
    noteTextElement.addEventListener('blur', (e) => saveNoteContent(e.target.dataset.id, e.target.textContent));

    const pinBtn = card.querySelector('.pin-btn');
    pinBtn.addEventListener('click', (e) => toggleNotePin(e.currentTarget.dataset.id));

    const settingsBtn = card.querySelector('.settings-btn');
    settingsBtn.addEventListener('click', (e) => openNoteSettingsPopup(e, note.id));

    return card;
}

function openNoteSettingsPopup(event, noteId) {
    const popup = document.getElementById('noteSettingsPopup');

    // If the popup is already visible for the same note, hide it and exit.
    if (popup.classList.contains('show') && popup.dataset.noteId === String(noteId)) {
        popup.classList.remove('show');
        return;
    }

    const deleteBtn = document.getElementById('deleteNoteBtn');
    const palette = popup.querySelector('.note-color-picker .color-palette');

    // Find the note and its current color
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Set a data attribute on the popup to reference the note
    popup.dataset.noteId = noteId;

    // Set up the delete button's onclick
    deleteBtn.onclick = () => deleteNote(noteId);
    
    // Reset selection and highlight the current color
    palette.querySelectorAll('.color-box').forEach(box => {
        box.classList.remove('selected');
        if (box.dataset.color === note.color) {
            box.classList.add('selected');
        }
        
        // Add click listener to each color box
        box.onclick = () => {
            updateNoteColor(noteId, box.dataset.color);
            // Hide the popup after selection
            popup.classList.remove('show');
        };
    });

    // Position the popup near the gear icon
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Add scroll offsets to be correct relative to the document
    const top = rect.bottom + window.scrollY + 5; // 5px spacing below the button
    const left = rect.right + window.scrollX; // Align to the right edge of the button

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    
    popup.classList.add('show');
}

function saveNoteTitle(id, newTitle) {
    const noteToUpdate = notes.find(note => String(note.id) === id);
    if (noteToUpdate) {
        noteToUpdate.title = newTitle;
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

function saveNoteContent(id, newContent) {
    const noteToUpdate = notes.find(note => String(note.id) === id);
    if (noteToUpdate) {
        noteToUpdate.content = newContent;
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

function toggleNotePin(id) {
    const noteToUpdate = notes.find(note => String(note.id) === id);
    if (noteToUpdate) {
        noteToUpdate.isPinned = !noteToUpdate.isPinned;
        if (noteToUpdate.isPinned) {
            noteToUpdate.pinnedTimestamp = Date.now();
        } else {
            delete noteToUpdate.pinnedTimestamp;
        }
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
    }
}

function updateNoteColor(id, color) {
    const noteToUpdate = notes.find(note => note.id === id);
    if (noteToUpdate) {
        noteToUpdate.color = color;
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes(); // Re-render to apply the color
    }
}

function deleteNote(id) {
    // Use a custom confirmation modal instead of alert/confirm
    showCustomConfirm('Biztosan törölni szeretné ezt a jegyzetet?', () => {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
    });
    document.getElementById('noteSettingsPopup').classList.remove('show');
}

// Generic function to render grouped items (for lists and cards)
function renderGroupedItems(items, containerId, itemRenderer, searchQuery = '', containerClass = 'card-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const query = searchQuery.toLowerCase();
    
    // Group items by patientId
    const groupedItems = items.reduce((acc, item) => {
        const patientId = item.patientId || 'general';
        if (!acc[patientId]) {
            acc[patientId] = [];
        }
        acc[patientId].push(item);
        return acc;
    }, {});
    
    // Get patient IDs and sort them by patient name ascending alphabetically
    const patientIds = Object.keys(groupedItems).sort((a, b) => {
        const patientA = patients.find(p => String(p.id) === a);
        const patientB = patients.find(p => String(p.id) === b);
        const nameA = patientA ? patientA.name : 'Általános';
        const nameB = patientB ? patientB.name : 'Általános';
        return nameA.localeCompare(nameB, 'hu'); // Ascending sort
    });

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek tételek a keresési feltételeknek megfelelően.</div>';
    }
    
    // Iterate through sorted patient groups and render
    patientIds.forEach(patientId => {
        const patient = patients.find(p => String(p.id) === patientId);
        const patientName = patient ? patient.name : 'Általános';
        
        // Filter items within the group
        const filteredGroupItems = groupedItems[patientId].filter(item => {
            const matchesPatientName = patientName.toLowerCase().includes(query);
            let matchesContent = false;
            
            if (item.item) { // For shopping list
                matchesContent = item.item.toLowerCase().includes(query);
            } else if (item.name) { // For documents
                matchesContent = item.name.toLowerCase().includes(query);
            } else if (item.content) { // For notes
                matchesContent = item.content.toLowerCase().includes(query);
            }
            
            return matchesPatientName || matchesContent;
        });

        // Only render the group if there are matching items
        if (filteredGroupItems.length > 0) {
            const groupWrapper = document.createElement('div');
            groupWrapper.className = `patient-list-group ${containerClass}`;
            
            const heading = document.createElement('h3');
            heading.className = 'patient-list-heading';
            heading.textContent = patientName;
            groupWrapper.appendChild(heading);

            // Create a list for the items
            const listElement = document.createElement('ul');
            listElement.className = 'shopping-list-items';

            filteredGroupItems.forEach(item => {
                listElement.appendChild(itemRenderer(item));
            });
            
            groupWrapper.appendChild(listElement);

            // Add new item form if it's the shopping list
            if (containerId === 'shoppingList') {
                const addForm = document.createElement('form');
                addForm.className = 'inline-form mt-4';
                addForm.dataset.patientId = patientId;
                addForm.innerHTML = `
                    <input type="text" placeholder="Új tétel hozzáadása..." required class="form-input flex-1">
                    <button type="submit" class="btn btn-primary">Hozzáad</button>
                `;
                groupWrapper.appendChild(addForm);

                addForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const input = e.target.querySelector('input');
                    const newItemName = input.value.trim();
                    const targetPatientId = parseInt(e.target.dataset.patientId);

                    if (newItemName) {
                        const existingItem = shoppingItems.find(item => item.item.toLowerCase() === newItemName.toLowerCase() && item.patientId === targetPatientId);
                        
                        if (existingItem) {
                            // If item exists and is completed, uncheck it
                            if (existingItem.completed) {
                                existingItem.completed = false;
                            }
                        } else {
                            // If item does not exist, add it
                            const newItem = {
                                id: Date.now() + Math.random(),
                                item: newItemName,
                                patientId: targetPatientId,
                                completed: false
                            };
                            shoppingItems.push(newItem);
                        }

                        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
                        renderShoppingList(searchQuery);
                    }
                });
            }

            container.appendChild(groupWrapper);
        }
    });

    if (container.children.length === 0) {
        container.innerHTML = '<div class="empty-state">Nincsenek tételek a keresési feltételeknek megfelelően.</div>';
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

        } catch (error) {
            console.error('Error uploading file:', error);
            // Use a custom modal instead of alert
            showCustomMessage('Hiba a fájl feldolgozásakor. Kérjük, ellenőrizze, hogy a fájl érvényes JSON formátumú.', 'error');
        }
    };
    reader.readAsText(file);
}

function deleteAllInfo() {
    // Use a custom confirmation modal instead of alert/confirm
    showCustomConfirm('Biztosan törölni szeretné az ÖSSZES adatot? Ez a művelet nem vonható vissza!', () => {
        localStorage.clear();
        patients = [];
        shoppingItems = [];
        documents = [];
        notes = [];
        savedCalculations = [];
        savedCalendarData = [];
        
        renderPatients();
        renderShoppingList();
        renderDocuments();
        renderNotes();
        updatePatientSelects();
        generateCalendar();
        clearTable();
        renderSavedCalculationsList();
        
        // Use a custom modal instead of alert
        showCustomMessage('Az összes adat törölve!', 'success');
    });
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
            // Use a custom confirmation modal instead of alert/confirm
            showCustomConfirm('Biztosan törölni szeretné az összes sort a táblázatból?', () => {
                clearTable();
            });
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
            const formattedDate = `${saveDate.getFullYear()}-${String(saveDate.getMonth() + 1).padStart(2, '0')}-${String(saveDate.getDate()).padStart(2, '0')}`;
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
                // Use a custom modal instead of alert
                showCustomMessage('Kérjük, adja meg a számítás nevét.', 'alert');
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
            // Find the closest parent with a data-id, which will be the saved-item div
            const parentDiv = e.target.closest('[data-id]');
            if (!parentDiv) return;

            const id = parentDiv.dataset.id;
            const button = e.target.closest('button');

            // If a button was clicked, handle it as before
            if (button) {
                if (button.classList.contains('delete-btn')) {
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
            } else {
                // If a button was NOT clicked, and a valid parent was found, load the calculation
                loadCalculation(id);
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
    const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    const optionsHTML = sortedPatients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
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
    
    // First, update the calendar data
    syncCalculatorToCalendar(saveDate);

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
    
    // Use a custom modal instead of alert
    showCustomMessage(`Számítás mentve! A számítás a(z) ${saveDate.toLocaleDateString()} naphoz lett hozzárendelve.`, 'success');
    
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
    if (!itemToLoad) return;
    
    // Set the global variable to the date of the loaded calculation
    currentCalculationDate = itemToLoad.created;

    loadTableWithData(itemToLoad.data);

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

function loadTableWithData(data) {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    data.forEach(rowData => {
        tableBody.appendChild(createCalculatorRow(rowData));
    });
    updateAllCalculations();
}


function deleteCalculation(id) {
    // Use a custom confirmation modal instead of alert/confirm
    showCustomConfirm('Biztosan törölni szeretné ezt a számítást?', () => {
        savedCalculations = savedCalculations.filter(item => item.id !== id);
        localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
        syncCalculatorToCalendar(currentCalculationDate);
        renderSavedCalculationsList();
    });
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
        // Use a custom modal instead of alert
        showCustomMessage('A táblázat üres. Nincs mit exportálni.', 'alert');
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

// Camera and Gemini API integration
async function startCamera() {
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraFeed');
    const message = document.getElementById('cameraMessage');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    
    // Remove the CSS class that flips the video feed
    video.classList.remove('hidden');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' }
            },
            audio: false
        });
        video.srcObject = stream;
        cameraStream = stream;
        cameraModal.style.display = 'flex';
        // Ensure the video feed is not mirrored
        video.style.transform = 'none';
        takePhotoBtn.classList.remove('hidden');
        message.classList.add('hidden');
    } catch (err) {
        console.error("Hiba a kamera elérésekor:", err);
        message.classList.remove('hidden');
        video.classList.add('hidden');
        takePhotoBtn.classList.add('hidden');
        cameraModal.style.display = 'flex';
    }
}

function stopCamera() {
    const cameraModal = document.getElementById('cameraModal');
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    cameraModal.style.display = 'none';
}

function capturePhoto() {
    const video = document.getElementById('cameraFeed');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the image without mirroring
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    imagePreview.src = imageData;
    imagePreview.classList.remove('hidden');
    analyzeBtn.classList.remove('hidden');
    stopCamera();
}

async function analyzeImageWithGemini(imageData, patientId) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');
    document.getElementById('analyzeBtn').disabled = true;

    // Convert data URL to base64 string
    const base64ImageData = imageData.split(',')[1];
    const prompt = 'Please identify the items on this handwritten shopping list and respond with a comma-separated list of the items, in Hungarian. Example: tej,kenyér,tojás. Do not include any other text.';

    try {
        const response = await fetch('/api/gemini-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64ImageData, prompt: prompt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API call failed');
        }

        const result = await response.json();
        const items = result.text.split(',').map(item => item.trim());
        openGeminiConfirmModal(items, patientId);

    } catch (error) {
        console.error('Hiba az elemzés során:', error);
        // Use a custom modal instead of alert
        showCustomMessage('Hiba történt az elemzés során. Kérjük, próbálja meg újra.', 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }
}

function addConfirmedItemsToShoppingList() {
    const listItems = document.querySelectorAll('#geminiItemsList .gemini-item-input');
    const patientId = parseInt(document.getElementById('geminiConfirmModal').dataset.patientId);
    
    let newItemsAdded = 0;
    const itemsToAdd = [];

    listItems.forEach(input => {
        const itemText = input.value.trim();
        if (itemText) {
            const existingItem = shoppingItems.find(item => item.item.toLowerCase() === itemText.toLowerCase() && item.patientId === patientId);

            if (existingItem) {
                if (existingItem.completed) {
                    existingItem.completed = false;
                }
            } else {
                itemsToAdd.push({
                    id: Date.now() + Math.random(),
                    item: itemText,
                    patientId: patientId,
                    completed: false
                });
                newItemsAdded++;
            }
        }
    });

    if (itemsToAdd.length > 0) {
        shoppingItems.push(...itemsToAdd);
    }

    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    renderShoppingList();
    
    if (newItemsAdded > 0) {
        showCustomMessage(`${newItemsAdded} új tétel került hozzáadásra.`, 'success');
    }
}

// Custom Modal functions (replacing alert and confirm)
function showCustomMessage(message, type = 'info') {
    const modalId = type === 'success' ? 'successModal' : type === 'error' ? 'errorModal' : 'infoModal';
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.querySelector('.modal-message').textContent = message;
    modal.classList.add('show');
    
    // Auto-close after a few seconds
    setTimeout(() => {
        modal.classList.remove('show');
    }, 3000);
}

function showCustomConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    modal.querySelector('.modal-message').textContent = message;
    
    confirmBtn.onclick = () => {
        onConfirm();
        modal.classList.remove('show');
    };
    
    cancelBtn.onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.classList.add('show');
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem(themeKey);
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(themeKey, isDark ? 'dark' : 'light');
}
