const API_URL = 'https://be30-35-198-254-190.ngrok-free.app/';

// Declare lamejs
// const lamejs = window.lamejs;
console.log('lamejs:', lamejs);
class ImageGenerator {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.mp3Encoder = null;
        this.settings = this.loadSettings();
        this.history = this.loadHistory();
        this.renderHistory();
        this.initializeDarkMode();
    }

    initializeElements() {
        // Core elements
        this.recordButton = document.getElementById('recordButton');
        this.sendTextButton = document.getElementById('sendTextButton');
        this.textInput = document.getElementById('textInput');
        this.statusDiv = document.getElementById('status');
        this.transcriptionDiv = document.getElementById('transcription');
        this.generatedImage = document.getElementById('generatedImage');
        this.chatHistory = document.getElementById('chatHistory');
        this.loadingOverlay = document.querySelector('.loading-overlay');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.emptyState = document.querySelector('.empty-state');

        // Image action buttons
        this.downloadButton = document.querySelector('.download-button');
        this.shareButton = document.querySelector('.share-button');
        this.regenerateButton = document.querySelector('.regenerate-button');

        // Navigation elements
        this.navItems = document.querySelectorAll('.nav-item');

        // Settings elements (will be initialized when settings panel is created)
        this.darkModeToggle = document.querySelector('.dark-mode-toggle');
    }

    initializeEventListeners() {
        // Core functionality
        this.sendTextButton.addEventListener('click', () => this.generateFromText());
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.generateFromText();
            }
        });

        // History management
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Image actions
        this.downloadButton.addEventListener('click', () => this.downloadImage());
        this.shareButton.addEventListener('click', () => this.shareImage());
        this.regenerateButton.addEventListener('click', () => this.regenerateImage());

        // Image load event
        this.generatedImage.addEventListener('load', () => {
            this.hideLoading();
            this.generatedImage.classList.add('visible');
            this.emptyState.style.display = 'none';
            this.enableImageActions();
        });

        // Navigation - update this part
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                console.log(`Nav item clicked: ${section}`);
                this.handleNavigation(item);
            });
        });

        // Dark mode toggle
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }

        // Window events
        window.addEventListener('beforeunload', () => {
            this.saveHistory();
            this.saveSettings();
        });
    }

    handleNavigation(clickedItem) {
        // Remove active class from all items
        this.navItems.forEach(item => item.classList.remove('active'));

        // Add active class to clicked item
        clickedItem.classList.add('active');

        // Get the section to show based on the clicked item
        const section = clickedItem.getAttribute('data-section') || 'generate';

        // Show the appropriate section
        this.showSection(section);
    }

    showSection(section) {
        console.log(`Showing section: ${section}`);

        // Hide all sections
        document.querySelectorAll('.generator-section, .settings-section, .history-section').forEach(el => {
            el.style.display = 'none';
        });

        // Show the requested section
        let sectionToShow;

        if (section === 'settings') {
            sectionToShow = document.querySelector('.settings-section');
            if (!sectionToShow) {
                sectionToShow = this.createSettingsPanel();
            }
        } else if (section === 'history') {
            sectionToShow = document.querySelector('.history-section');
            if (!sectionToShow) {
                sectionToShow = this.createHistoryPanel();
            }
        } else {
            // Default to generator section
            sectionToShow = document.querySelector('.generator-section');
        }

        if (sectionToShow) {
            // Use flex instead of grid for settings and history sections
            if (section === 'settings' || section === 'history') {
                sectionToShow.style.display = 'flex';
            } else {
                sectionToShow.style.display = 'grid';
            }

            console.log(`Section ${section} is now displayed`);
        } else {
            console.error(`Section ${section} not found`);
        }

        // Update URL hash for navigation
        window.location.hash = section;
    }

    initializeDarkMode() {
        // Check if dark mode is enabled in settings
        if (this.settings.darkMode) {
            document.body.classList.add('dark');
            if (this.darkModeToggle) {
                this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }

        // Check system preference if not set in settings
        if (this.settings.darkMode === undefined) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark');
                this.settings.darkMode = true;
                this.saveSettings();
                if (this.darkModeToggle) {
                    this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                }
            }
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark');
        this.settings.darkMode = document.body.classList.contains('dark');

        if (this.darkModeToggle) {
            this.darkModeToggle.innerHTML = this.settings.darkMode ?
                '<i class="fas fa-sun"></i>' :
                '<i class="fas fa-moon"></i>';
        }

        this.saveSettings();
        this.showNotification(
            this.settings.darkMode ? 'Dark mode enabled' : 'Light mode enabled',
            'Appearance updated',
            this.settings.darkMode ? 'moon' : 'sun'
        );
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('imagineAI_settings');
        return savedSettings ? JSON.parse(savedSettings) : {
            darkMode: false,
            imageSize: '512x512',
            imageStyle: 'realistic',
            saveHistory: true,
            maxHistoryItems: 20,
            apiKey: ''
        };
    }

    saveSettings() {
        localStorage.setItem('imagineAI_settings', JSON.stringify(this.settings));
    }

    loadHistory() {
        if (!this.settings.saveHistory) return [];

        const savedHistory = localStorage.getItem('imagineAI_history');
        return savedHistory ? JSON.parse(savedHistory) : [];
    }

    saveHistory() {
        if (!this.settings.saveHistory) return;

        // Limit history to maxHistoryItems
        if (this.history.length > this.settings.maxHistoryItems) {
            this.history = this.history.slice(0, this.settings.maxHistoryItems);
        }

        localStorage.setItem('imagineAI_history', JSON.stringify(this.history));
    }

    clearHistory() {
        // Clear DOM
        while (this.chatHistory.firstChild) {
            this.chatHistory.removeChild(this.chatHistory.firstChild);
        }

        // Clear history array
        this.history = [];

        // Save empty history
        this.saveHistory();

        // Show notification
        this.showNotification('History cleared', 'All generated images have been removed', 'trash');
    }

    showLoading() {
        this.loadingOverlay.classList.add('visible');
        this.generatedImage.classList.remove('visible');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('visible');
    }

    updateStatus(message, isError = false) {
        this.statusDiv.textContent = message;
        this.statusDiv.style.color = isError ? '#dc2626' : 'var(--text-secondary)';

        // Add animation effect
        this.statusDiv.style.animation = 'none';
        this.statusDiv.offsetHeight; // Trigger reflow
        this.statusDiv.style.animation = 'fadeIn 0.3s ease-out';
    }

    enableImageActions() {
        this.downloadButton.disabled = false;
        this.shareButton.disabled = false;
        this.regenerateButton.disabled = false;
    }

    disableImageActions() {
        this.downloadButton.disabled = true;
        this.shareButton.disabled = true;
        this.regenerateButton.disabled = true;
    }

    async generateFromText() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.updateStatus('Please enter a description', true);
            this.textInput.classList.add('shake');
            setTimeout(() => this.textInput.classList.remove('shake'), 500);
            return;
        }

        this.showLoading();
        this.updateStatus('Generating image...');
        this.sendTextButton.disabled = true;
        this.disableImageActions();

        try {
            const response = await fetch(`${API_URL}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    settings: {
                        imageSize: this.settings.imageSize,
                        imageStyle: this.settings.imageStyle
                    }
                })
            });

            const data = await response.json();

            if (data.image) {
                this.generatedImage.src = `data:image/png;base64,${data.image}`;
                this.addToHistory(text, data.image, 'text');
                this.textInput.value = '';
                this.updateStatus('Image Generated Successfully!');
            } else {
                this.updateStatus(data.error || 'Failed to generate image', true);
                this.hideLoading();
            }
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, true);
            console.error('Generation error:', error);
            this.hideLoading();
        } finally {
            this.sendTextButton.disabled = false;
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            await this.stopRecording();
        }
    }

    async startRecording() {
        // Check for MediaRecorder support
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            this.updateStatus('Recording is not supported in this browser', true);
            this.showNotification('Recording Not Supported', 'Your browser does not support audio recording.', 'alert-triangle', true);
            return;
        }

        // Check if lamejs is loaded
        if (!lamejs) {
            this.updateStatus('Audio encoding library not loaded', true);
            this.showNotification('Library Error', 'The audio encoding library is not available.', 'alert-triangle', true);
            return;
        }

        try {
            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];
            this.mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);

            // Initialize MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => this.processAudio();
            this.mediaRecorder.start();

            this.isRecording = true;
            this.recordButton.innerHTML = '<i class="fas fa-stop"></i> <span>Stop Recording</span>';
            this.recordButton.classList.add('recording');
            this.updateStatus('Recording...');

            // Add recording animation
            this.addRecordingAnimation();

            console.log('Recording started successfully');
        } catch (err) {
            this.updateStatus(`Recording error: ${err.message}`, true);
            console.error('Recording error:', err);
            this.showNotification('Recording Error', err.message, 'alert-triangle', true);

            // If there's an error, ensure the recording state is reset
            this.isRecording = false;
            this.recordButton.innerHTML = '<i class="fas fa-microphone"></i> <span>Record Description</span>';
            this.recordButton.classList.remove('recording');
        }
    }

    addRecordingAnimation() {
        // Create recording animation if it doesn't exist
        if (!document.querySelector('.recording-animation')) {
            const animation = document.createElement('div');
            animation.className = 'recording-animation';
            animation.innerHTML = `
                <div class="recording-dot"></div>
                <div class="recording-timer">00:00</div>
            `;

            // Add after record button
            this.recordButton.parentNode.appendChild(animation);

            // Start timer
            this.startRecordingTimer();
        }
    }

    startRecordingTimer() {
        const timerElement = document.querySelector('.recording-timer');
        if (!timerElement) return;

        let seconds = 0;
        this.recordingTimer = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerElement.textContent = `${mins}:${secs}`;

            // Auto-stop after 60 seconds to prevent very large files
            if (seconds >= 60) {
                this.stopRecording();
            }
        }, 1000);
    }

    removeRecordingAnimation() {
        const animation = document.querySelector('.recording-animation');
        if (animation) {
            animation.remove();
        }

        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.audioStream.getTracks().forEach(track => track.stop());

            this.isRecording = false;
            this.recordButton.innerHTML = '<i class="fas fa-microphone"></i> <span>Record Description</span>';
            this.recordButton.classList.remove('recording');
            this.updateStatus('Processing audio...');
            this.removeRecordingAnimation();
        }
    }

    async processAudio() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        const fileReader = new FileReader();
        fileReader.onloadend = async () => {
            const arrayBuffer = fileReader.result;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const samples = audioBuffer.getChannelData(0);
                const mp3Buffer = this.encodeMP3(samples);

                const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(mp3Buffer)));

                this.showLoading();
                this.disableImageActions();

                const response = await fetch(`${API_URL}/transcribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audio: base64Audio,
                        filename: 'recorded_audio.mp3',
                        settings: {
                            imageSize: this.settings.imageSize,
                            imageStyle: this.settings.imageStyle
                        }
                    })
                });

                const data = await response.json();

                if (data.image) {
                    this.generatedImage.src = `data:image/png;base64,${data.image}`;
                    if (data.text) {
                        this.transcriptionDiv.textContent = `Transcribed: ${data.text}`;
                        this.transcriptionDiv.style.animation = 'fadeIn 0.3s ease-out';
                    }
                    this.addToHistory(data.text || 'Audio Input', data.image, 'voice');
                    this.updateStatus('Image Generated Successfully!');
                } else {
                    this.updateStatus(data.error || 'Failed to generate image', true);
                    this.hideLoading();
                }
            } catch (error) {
                this.updateStatus(`Error processing audio: ${error.message}`, true);
                console.error('Audio processing error:', error);
                this.hideLoading();
                this.showNotification('Processing Error', error.message, 'alert-triangle', true);
            }
        };

        fileReader.readAsArrayBuffer(audioBlob);
    }

    encodeMP3(samples) {
        const sampleBlockSize = 1152;
        const mp3Buffers = [];

        for (let i = 0; i < samples.length; i += sampleBlockSize) {
            const sampleChunk = samples.subarray(i, i + sampleBlockSize);
            const int16Samples = new Int16Array(sampleChunk.length);

            for (let j = 0; j < sampleChunk.length; j++) {
                int16Samples[j] = sampleChunk[j] < 0
                    ? sampleChunk[j] * 0x8000
                    : sampleChunk[j] * 0x7FFF;
            }

            const mp3Chunk = this.mp3Encoder.encodeBuffer(int16Samples);
            if (mp3Chunk.length > 0) {
                mp3Buffers.push(mp3Chunk);
            }
        }

        const finalMp3Chunk = this.mp3Encoder.flush();
        if (finalMp3Chunk.length > 0) {
            mp3Buffers.push(finalMp3Chunk);
        }

        return mp3Buffers.reduce((acc, val) => {
            const tmp = new Uint8Array(acc.length + val.length);
            tmp.set(acc, 0);
            tmp.set(val, acc.length);
            return tmp;
        }, new Uint8Array(0));
    }

    addToHistory(text, imageBase64, source = 'text') {
        // Create history item object
        const historyItem = {
            id: Date.now(),
            prompt: text,
            image: imageBase64,
            timestamp: new Date().toISOString(),
            source: source
        };

        // Add to history array
        this.history.unshift(historyItem);

        // Save history
        this.saveHistory();

        // Update UI
        this.addHistoryItemToDOM(historyItem);
    }

    addHistoryItemToDOM(item) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;

        // Format date
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        historyItem.innerHTML = `
            <div class="history-image-container">
                <img src="data:image/png;base64,${item.image}" alt="${item.prompt}" class="history-image">
            </div>
            <div class="history-details">
                <div class="history-prompt">${item.prompt}</div>
                <div class="history-meta">
                    <span class="history-source ${item.source}">${item.source === 'text' ? 'Text' : 'Voice'}</span>
                    <span class="history-date">${formattedDate}</span>
                </div>
            </div>
        `;

        // Add click event to view the image
        historyItem.addEventListener('click', () => {
            this.viewHistoryItem(item);
        });

        // Add to DOM with animation
        this.chatHistory.prepend(historyItem);

        // Animate entry
        setTimeout(() => {
            historyItem.style.opacity = '1';
            historyItem.style.transform = 'translateY(0)';
        }, 10);
    }

    renderHistory() {
        // Clear existing history in DOM
        this.chatHistory.innerHTML = '';

        // Add each history item to DOM
        this.history.forEach(item => {
            this.addHistoryItemToDOM(item);
        });
    }

    viewHistoryItem(item) {
        // Set the current image
        this.generatedImage.src = `data:image/png;base64,${item.image}`;
        this.generatedImage.classList.add('visible');
        this.emptyState.style.display = 'none';

        // Enable image actions
        this.enableImageActions();

        // Set the text input to the prompt
        this.textInput.value = item.prompt;

        // Scroll to the generator section
        document.querySelector('.generator-section').scrollIntoView({ behavior: 'smooth' });

        // Show notification
        this.showNotification('Image Loaded', 'Previous generation loaded', 'image');
    }

    downloadImage() {
        if (!this.generatedImage.src || this.generatedImage.src.includes('/placeholder.svg')) {
            this.showNotification('No Image', 'Generate an image first', 'alert-circle', true);
            return;
        }

        const link = document.createElement('a');
        link.download = `imagineai-${Date.now()}.png`;
        link.href = this.generatedImage.src;
        link.click();

        this.showNotification('Download Started', 'Image downloaded successfully', 'download');
    }

    shareImage() {
        if (!this.generatedImage.src || this.generatedImage.src.includes('/placeholder.svg')) {
            this.showNotification('No Image', 'Generate an image first', 'alert-circle', true);
            return;
        }

        if (navigator.share) {
            // Convert base64 to blob for sharing
            fetch(this.generatedImage.src)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'imagineai.png', { type: 'image/png' });
                    navigator.share({
                        title: 'My AI Generated Image',
                        text: 'Check out this image I created with ImagineAI!',
                        files: [file]
                    })
                        .then(() => this.showNotification('Shared', 'Image shared successfully', 'share'))
                        .catch(err => {
                            console.error('Share error:', err);
                            this.showNotification('Share Failed', err.message, 'alert-triangle', true);
                        });
                });
        } else {
            // Fallback to clipboard copy
            this.copyImageToClipboard();
        }
    }

    copyImageToClipboard() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item])
                    .then(() => this.showNotification('Copied', 'Image copied to clipboard', 'clipboard'))
                    .catch(err => {
                        console.error('Clipboard error:', err);
                        this.showNotification('Copy Failed', err.message, 'alert-triangle', true);
                    });
            });
        };

        img.src = this.generatedImage.src;
    }

    regenerateImage() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.updateStatus('Please enter a description to regenerate', true);
            return;
        }

        // Simply call generate again
        this.generateFromText();
    }

    showNotification(title, message, icon = 'info', isError = false) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-icon ${isError ? 'error' : 'success'}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Add close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        });

        // Show with animation
        setTimeout(() => notification.classList.add('visible'), 10);

        // Auto hide after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('visible');
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    // Settings Panel Methods
    createSettingsPanel() {
        const settingsSection = document.createElement('section');
        settingsSection.className = 'settings-section';
        settingsSection.style.display = 'none';

        settingsSection.innerHTML = `
            <div class="section-header">
                <h3>Settings</h3>
                <button id="resetSettingsBtn" class="text-button">
                    <i class="fas fa-undo"></i>
                    <span>Reset to Defaults</span>
                </button>
            </div>
            
            <div class="settings-panel">
                <div class="settings-group">
                    <h4>Appearance</h4>
                    <div class="settings-item">
                        <label for="darkModeSwitch">Dark Mode</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="darkModeSwitch" ${this.settings.darkMode ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>Image Generation</h4>
                    <div class="settings-item">
                        <label for="imageSize">Image Size</label>
                        <select id="imageSize">
                            <option value="256x256" ${this.settings.imageSize === '256x256' ? 'selected' : ''}>Small (256x256)</option>
                            <option value="512x512" ${this.settings.imageSize === '512x512' ? 'selected' : ''}>Medium (512x512)</option>
                            <option value="1024x1024" ${this.settings.imageSize === '1024x1024' ? 'selected' : ''}>Large (1024x1024)</option>
                        </select>
                    </div>
                    <div class="settings-item">
                        <label for="imageStyle">Image Style</label>
                        <select id="imageStyle">
                            <option value="realistic" ${this.settings.imageStyle === 'realistic' ? 'selected' : ''}>Realistic</option>
                            <option value="cartoon" ${this.settings.imageStyle === 'cartoon' ? 'selected' : ''}>Cartoon</option>
                            <option value="artistic" ${this.settings.imageStyle === 'artistic' ? 'selected' : ''}>Artistic</option>
                            <option value="abstract" ${this.settings.imageStyle === 'abstract' ? 'selected' : ''}>Abstract</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>History</h4>
                    <div class="settings-item">
                        <label for="saveHistorySwitch">Save History</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="saveHistorySwitch" ${this.settings.saveHistory ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <label for="maxHistoryItems">Maximum History Items</label>
                        <select id="maxHistoryItems">
                            <option value="10" ${this.settings.maxHistoryItems === 10 ? 'selected' : ''}>10 items</option>
                            <option value="20" ${this.settings.maxHistoryItems === 20 ? 'selected' : ''}>20 items</option>
                            <option value="50" ${this.settings.maxHistoryItems === 50 ? 'selected' : ''}>50 items</option>
                            <option value="100" ${this.settings.maxHistoryItems === 100 ? 'selected' : ''}>100 items</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4>API Configuration</h4>
                    <div class="settings-item">
                        <label for="apiKey">API Key (optional)</label>
                        <input type="text" id="apiKey" placeholder="Enter your API key" value="${this.settings.apiKey || ''}">
                    </div>
                </div>
            </div>
        `;

        // Add to main content
        document.querySelector('.main-content').appendChild(settingsSection);

        // Add event listeners for settings
        this.initializeSettingsListeners();

        return settingsSection;
    }

    // Add method to create history panel if it doesn't exist
    createHistoryPanel() {
        console.log('Creating history panel');
        const historySection = document.createElement('section');
        historySection.className = 'history-section recent-generations';
        historySection.style.display = 'none';

        historySection.innerHTML = `
            <div class="section-header">
                <h3>Image History</h3>
                <button id="clearHistoryBtn" class="text-button">
                    <i class="fas fa-trash"></i>
                    <span>Clear History</span>
                </button>
            </div>
            
            <div id="historyGrid" class="history-grid">
                ${this.history.length === 0 ?
                '<div class="empty-state"><i class="fas fa-image"></i><p>No images in history yet</p></div>' :
                ''}
            </div>
        `;

        // Add to main content
        document.querySelector('.main-content').appendChild(historySection);

        // Update chatHistory reference to point to the history grid
        this.chatHistory = historySection.querySelector('#historyGrid');

        // Add event listener for clear history button
        const clearBtn = historySection.querySelector('#clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }

        // Render history items
        this.renderHistory();

        return historySection;
    }

    // Complete the initializeSettingsListeners method and add the remaining code

    initializeSettingsListeners() {
        // Dark mode toggle
        const darkModeSwitch = document.getElementById('darkModeSwitch');
        if (darkModeSwitch) {
            darkModeSwitch.addEventListener('change', () => {
                this.settings.darkMode = darkModeSwitch.checked;
                this.toggleDarkMode();
            });
        }

        // Image size
        const imageSize = document.getElementById('imageSize');
        if (imageSize) {
            imageSize.addEventListener('change', () => {
                this.settings.imageSize = imageSize.value;
                this.saveSettings();
                this.showNotification('Settings Updated', 'Image size changed to ' + imageSize.value, 'cog');
            });
        }

        // Image style
        const imageStyle = document.getElementById('imageStyle');
        if (imageStyle) {
            imageStyle.addEventListener('change', () => {
                this.settings.imageStyle = imageStyle.value;
                this.saveSettings();
                this.showNotification('Settings Updated', 'Image style changed to ' + imageStyle.value, 'cog');
            });
        }

        // Save history
        const saveHistorySwitch = document.getElementById('saveHistorySwitch');
        if (saveHistorySwitch) {
            saveHistorySwitch.addEventListener('change', () => {
                this.settings.saveHistory = saveHistorySwitch.checked;
                this.saveSettings();

                if (this.settings.saveHistory) {
                    this.saveHistory();
                    this.showNotification('Settings Updated', 'History saving enabled', 'cog');
                } else {
                    this.showNotification('Settings Updated', 'History saving disabled', 'cog');
                }
            });
        }

        // Max history items
        const maxHistoryItems = document.getElementById('maxHistoryItems');
        if (maxHistoryItems) {
            maxHistoryItems.addEventListener('change', () => {
                this.settings.maxHistoryItems = parseInt(maxHistoryItems.value);
                this.saveSettings();
                this.showNotification('Settings Updated', 'Maximum history items set to ' + maxHistoryItems.value, 'cog');

                // Trim history if needed
                if (this.history.length > this.settings.maxHistoryItems) {
                    this.history = this.history.slice(0, this.settings.maxHistoryItems);
                    this.saveHistory();
                    this.renderHistory();
                }
            });
        }

        // API Key
        const apiKey = document.getElementById('apiKey');
        if (apiKey) {
            apiKey.addEventListener('change', () => {
                this.settings.apiKey = apiKey.value.trim();
                this.saveSettings();
                this.showNotification('Settings Updated', 'API key saved', 'key');
            });
        }

        // Reset settings
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    resetSettings() {
        // Default settings
        this.settings = {
            darkMode: false,
            imageSize: '512x512',
            imageStyle: 'realistic',
            saveHistory: true,
            maxHistoryItems: 20,
            apiKey: ''
        };

        // Save settings
        this.saveSettings();

        // Update UI
        document.body.classList.remove('dark');
        if (this.darkModeToggle) {
            this.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }

        // Update form elements
        const darkModeSwitch = document.getElementById('darkModeSwitch');
        if (darkModeSwitch) darkModeSwitch.checked = false;

        const imageSize = document.getElementById('imageSize');
        if (imageSize) imageSize.value = '512x512';

        const imageStyle = document.getElementById('imageStyle');
        if (imageStyle) imageStyle.value = 'realistic';

        const saveHistorySwitch = document.getElementById('saveHistorySwitch');
        if (saveHistorySwitch) saveHistorySwitch.checked = true;

        const maxHistoryItems = document.getElementById('maxHistoryItems');
        if (maxHistoryItems) maxHistoryItems.value = '20';

        const apiKey = document.getElementById('apiKey');
        if (apiKey) apiKey.value = '';

        // Show notification
        this.showNotification('Settings Reset', 'All settings have been reset to defaults', 'refresh-cw');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new ImageGenerator();

    // Create settings panel if it doesn't exist
    if (!document.querySelector('.settings-section')) {
        app.createSettingsPanel();
    }

    // Create history panel if it doesn't exist
    if (!document.querySelector('.history-section')) {
        app.createHistoryPanel();
    }

    // Check URL hash for navigation
    const hash = window.location.hash.substring(1);
    if (hash) {
        const navItem = document.querySelector(`.nav-item[data-section="${hash}"]`);
        if (navItem) {
            app.handleNavigation(navItem);
        }
    }

    // Create dark mode toggle if it doesn't exist
    if (!document.querySelector('.dark-mode-toggle')) {
        const darkModeToggle = document.createElement('button');
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = app.settings.darkMode ?
            '<i class="fas fa-sun"></i>' :
            '<i class="fas fa-moon"></i>';
        darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');

        document.body.appendChild(darkModeToggle);
        darkModeToggle.addEventListener('click', () => app.toggleDarkMode());
        app.darkModeToggle = darkModeToggle;
    }

    // Expose app to window for debugging
    window.imageGenerator = app;
});