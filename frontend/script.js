const API_URL = 'http://127.0.0.1:8000/summarize/';

let currentStage = 0;
let uploadedFile = null;
let isProcessing = false;

// DOM elements
const uploadSection = document.getElementById('upload-section');
const processingSection = document.getElementById('processing-section');
const summarySection = document.getElementById('summary-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File upload events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Summary actions
    document.getElementById('copy-button').addEventListener('click', copyToClipboard);
    document.getElementById('download-button').addEventListener('click', downloadSummary);
    document.getElementById('reset-button').addEventListener('click', resetApp);
    
    // Prevent default drag behaviors on document
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
}

// File handling functions
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (isVideoFile(file)) {
            handleFileUpload(file);
        } else {
            showAlert('Please select a valid video file.');
        }
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
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    return validTypes.includes(file.type);
}

function handleFileUpload(file) {
    if (isProcessing) return;
    
    uploadedFile = file;
    document.getElementById('file-name').textContent = file.name;
    
    // Switch to processing view
    uploadSection.classList.add('hidden');
    processingSection.classList.remove('hidden');
    
    // Start processing (real API + UI stages)
    startProcessing();
}

// Processing functions (adaptive progress + real API)
async function startProcessing() {
    if (!uploadedFile) return;

    isProcessing = true;
    currentStage = 0;

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", uploadedFile);

    // Start backend request
    const backendPromise = fetch(API_URL, {
        method: "POST",
        body: formData
    });

    // Animate stages
    await processStageAdaptive(1, backendPromise, false);
    await processStageAdaptive(2, backendPromise, false);
    await processStageAdaptive(3, backendPromise, true);

    // Wait for backend to finish
    try {
        const response = await backendPromise;
        if (!response.ok) {
            showAlert("Error: could not process video.");
            return;
        }
        const data = await response.json();

        // ✅ Now complete last stage
        finishFinalStage(3);

        // Switch to summary view
        processingSection.classList.add('hidden');
        summarySection.classList.remove('hidden');
        document.getElementById('summary-file-name').textContent = uploadedFile.name;
        document.getElementById('processed-time').textContent = new Date().toLocaleString();
        document.getElementById('summary-text').textContent = data.summary;

    } catch (err) {
        console.error(err);
        showAlert("An error occurred while contacting the backend.");
    }

    isProcessing = false;
}

async function processStageAdaptive(stageNum, backendPromise, isFinalStage) {
    currentStage = stageNum;
    updateOverallProgress();

    const stage = document.getElementById(`stage-${stageNum}`);
    const progressText = document.getElementById(`progress-${stageNum}`);
    const progressFill = document.getElementById(`progress-fill-${stageNum}`);

    stage.classList.add('active');
    let progress = 0;
    const maxLimit = isFinalStage ? 90 : 100;

    // Fill until 90% if final stage, otherwise full
    while (progress < maxLimit) {
        progress += 2;
        progressText.textContent = `${progress}%`;
        progressFill.style.width = `${progress}%`;
        await sleep(150);
    }

    if (!isFinalStage) {
        completeStage(stageNum);
    }
}

function finishFinalStage(stageNum) {
    const stage = document.getElementById(`stage-${stageNum}`);
    const progressText = document.getElementById(`progress-${stageNum}`);
    const progressFill = document.getElementById(`progress-fill-${stageNum}`);

    progressText.textContent = `100%`;
    progressFill.style.width = `100%`;

    completeStage(stageNum);
    updateOverallProgress();
}

function completeStage(stageNum) {
    const stage = document.getElementById(`stage-${stageNum}`);
    const progressText = document.getElementById(`progress-${stageNum}`);
    const completedText = stage.querySelector('.completed-text');
    const stageNumber = stage.querySelector('.stage-number');
    const stageCheck = stage.querySelector('.stage-check');
    
    stage.classList.remove('active');
    stage.classList.add('completed');
    
    progressText.classList.add('hidden');
    completedText.classList.remove('hidden');
    stageNumber.classList.add('hidden');
    stageCheck.classList.remove('hidden');
}

function updateOverallProgress() {
    const overallText = document.getElementById('overall-text');
    const overallProgressFill = document.getElementById('overall-progress-fill');
    
    const progress = (currentStage / 3) * 100;
    overallText.textContent = `Overall Progress: Stage ${currentStage} of 3`;
    overallProgressFill.style.width = `${progress}%`;
}

// Summary actions
async function copyToClipboard() {
    const summaryText = document.getElementById('summary-text').textContent;
    
    try {
        await navigator.clipboard.writeText(summaryText);
        showAlert('Summary copied to clipboard!');
    } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = summaryText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('Summary copied to clipboard!');
    }
}

function downloadSummary() {
    const summaryText = document.getElementById('summary-text').textContent;
    const fileName = uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '') : 'video';
    
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Summary downloaded successfully!');
}

function resetApp() {
    currentStage = 0;
    uploadedFile = null;
    isProcessing = false;
    fileInput.value = '';
    
    for (let i = 1; i <= 3; i++) {
        const stage = document.getElementById(`stage-${i}`);
        const progressText = document.getElementById(`progress-${i}`);
        const completedText = stage.querySelector('.completed-text');
        const progressFill = document.getElementById(`progress-fill-${i}`);
        const stageNumber = stage.querySelector('.stage-number');
        const stageCheck = stage.querySelector('.stage-check');
        
        stage.classList.remove('active', 'completed');
        progressText.classList.remove('hidden');
        completedText.classList.add('hidden');
        progressText.textContent = '0%';
        progressFill.style.width = '0%';
        stageNumber.classList.remove('hidden');
        stageCheck.classList.add('hidden');
    }
    
    document.getElementById('overall-text').textContent = 'Overall Progress: Stage 1 of 3';
    document.getElementById('overall-progress-fill').style.width = '0%';
    
    uploadSection.classList.remove('hidden');
    processingSection.classList.add('hidden');
    summarySection.classList.add('hidden');
}

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showAlert(message) {
    alert(message);
}
