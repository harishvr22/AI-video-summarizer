const API_URL = 'http://127.0.0.1:8000/summarize/';

// App state
let currentStage = 0;
let uploadedFile = null;
let isProcessing = false;

// DOM elements (may be null on some pages)
const uploadSection = document.getElementById('upload-section');
const processingSection = document.getElementById('processing-section');
const summarySection = document.getElementById('summary-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    initializeEventListeners();
}

function initializeEventListeners() {

    /* =========================
       UPLOAD PAGE ONLY
    ==========================*/
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    /* =========================
       SUMMARY PAGE BUTTONS
    ==========================*/
    const copyBtn = document.getElementById('copy-button');
    const downloadBtn = document.getElementById('download-button');
    const resetBtn = document.getElementById('reset-button');

    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadSummary);
    if (resetBtn) resetBtn.addEventListener('click', resetApp);

    /* =========================
       HISTORY PAGE
    ==========================*/
    const historyList = document.getElementById('history-list');
    if (historyList) {
        loadHistoryPage();
    }

    // Global drag prevention
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
}

/* =========================
   FILE HANDLING
=========================*/
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && isVideoFile(file)) {
        handleFileUpload(file);
    } else {
        showAlert('Please select a valid video file.');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && isVideoFile(file)) {
        handleFileUpload(file);
    } else if (file) {
        showAlert('Please select a valid video file.');
    }
}

function isVideoFile(file) {
    return ['video/mp4','video/avi','video/mov','video/wmv','video/webm'].includes(file.type);
}

function handleFileUpload(file) {
    if (isProcessing) return;

    uploadedFile = file;
    document.getElementById('file-name').textContent = file.name;

    uploadSection.classList.add('hidden');
    processingSection.classList.remove('hidden');

    startProcessing();
}

/* =========================
   PROCESSING
=========================*/
async function startProcessing() {
    isProcessing = true;
    currentStage = 0;

    const formData = new FormData();
    formData.append("file", uploadedFile);

    const backendPromise = fetch(API_URL, {
        method: "POST",
        body: formData
    });

    await processStageAdaptive(1, false);
    await processStageAdaptive(2, false);
    await processStageAdaptive(3, true);

    try {
        const res = await backendPromise;
        if (!res.ok) throw new Error();

        const data = await res.json();

        finishFinalStage(3);
        processingSection.classList.add('hidden');
        summarySection.classList.remove('hidden');

        document.getElementById('summary-file-name').textContent = uploadedFile.name;
        document.getElementById('processed-time').textContent = new Date().toLocaleString();
        document.getElementById('summary-text').textContent = data.summary;

    } catch {
        showAlert("Error processing video");
    }

    isProcessing = false;
}

async function processStageAdaptive(stageNum, isFinal) {
    currentStage = stageNum;
    updateOverallProgress();

    const progressFill = document.getElementById(`progress-fill-${stageNum}`);
    const progressText = document.getElementById(`progress-${stageNum}`);

    let progress = 0;
    const max = isFinal ? 90 : 100;

    while (progress < max) {
        progress += 2;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        await sleep(120);
    }

    if (!isFinal) completeStage(stageNum);
}

function finishFinalStage(stageNum) {
    document.getElementById(`progress-fill-${stageNum}`).style.width = `100%`;
    document.getElementById(`progress-${stageNum}`).textContent = `100%`;
    completeStage(stageNum);
}

function completeStage(stageNum) {
    const stage = document.getElementById(`stage-${stageNum}`);
    stage.classList.add('completed');
    stage.classList.remove('active');
}

function updateOverallProgress() {
    const percent = (currentStage / 3) * 100;
    document.getElementById('overall-progress-fill').style.width = `${percent}%`;
}

/* =========================
   SUMMARY ACTIONS
=========================*/
async function copyToClipboard() {
    await navigator.clipboard.writeText(
        document.getElementById('summary-text').textContent
    );
    showAlert("Copied!");
}

function downloadSummary() {
    const text = document.getElementById('summary-text').textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'summary.txt';
    a.click();
}

function resetApp() {
    location.reload();
}

/* =========================
   HISTORY PAGE
=========================*/
async function loadHistoryPage() {
    const list = document.getElementById('history-list');
    try {
        const res = await fetch('http://127.0.0.1:8000/activities/');
        const data = await res.json();
        renderHistory(data.activities || [], list);
    } catch {
        list.innerHTML = '<p>No history found.</p>';
    }
}

function renderHistory(activities, container) {
    if (!activities.length) {
        container.innerHTML = '<p>No activity yet.</p>';
        return;
    }

    container.innerHTML = activities.map(a => `
        <div class="activity-item">
            <strong>${a.file}</strong><br/>
            <small>${new Date(a.processed_time).toLocaleString()}</small>
        </div>
    `).join('');
}

/* =========================
   UTIL
=========================*/
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function showAlert(msg) {
    alert(msg);
}
