document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const amountInput = document.getElementById('amount');
    const formSection = document.getElementById('payment-form');
    const qrSection = document.getElementById('qr-section');
    const qrImage = document.getElementById('qr-image');
    const displayAmount = document.getElementById('display-amount');
    const displayCurrency = document.getElementById('display-currency');
    const displayBill = document.getElementById('display-bill');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    const pulseRing = document.querySelector('.pulse-ring');
    const newPaymentBtn = document.getElementById('new-payment-btn');
    const errorMessage = document.getElementById('error-message');
    const spinner = document.querySelector('.spinner');
    const btnText = generateBtn.querySelector('span');

    let pollInterval;
    let currentPayerName = '';
    let currentPayerRemark = '';
    let currentAmount = '';

    generateBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        if (!amount || amount <= 0) {
            showError("Please enter a valid amount.");
            return;
        }
        
        currentAmount = amount;
        currentPayerName = document.getElementById('payer-name').value.trim();
        currentPayerRemark = document.getElementById('payer-remark').value.trim();

        hideError();
        setLoading(true);

        try {
            const response = await fetch('/generate_qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: amount })
            });

            const data = await response.json();

            if (data.success) {
                // Set Details
                displayAmount.textContent = parseFloat(data.amount).toFixed(2);
                displayCurrency.textContent = data.currency;
                displayBill.textContent = data.bill_number;

                // Load QR Image
                qrImage.src = `/qr_image?qr_string=${encodeURIComponent(data.qr_string)}`;
                
                // Show QR Section
                formSection.classList.add('hidden');
                qrSection.classList.remove('hidden');

                // Start polling
                startPolling(data.md5);
            } else {
                showError(data.error || "Failed to generate QR code.");
            }
        } catch (error) {
            showError("A network error occurred.");
        } finally {
            setLoading(false);
        }
    });

    newPaymentBtn.addEventListener('click', () => {
        // Reset UI
        qrSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        amountInput.value = '';
        document.getElementById('payer-name').value = '';
        document.getElementById('payer-remark').value = '';
        
        // Reset Status
        statusIndicator.className = 'status-indicator pending';
        statusText.textContent = 'Awaiting Payment...';
        pulseRing.classList.remove('hidden');
        newPaymentBtn.classList.add('hidden');
        document.getElementById('payer-details').classList.add('hidden');
        
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });

    function startPolling(md5) {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max (polling every 5 seconds)

        pollInterval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(pollInterval);
                statusText.textContent = 'Payment Timeout';
                pulseRing.classList.add('hidden');
                newPaymentBtn.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch(`/check_status?md5=${encodeURIComponent(md5)}`);
                const data = await response.json();

                if (data.success && data.status === "PAID") {
                    clearInterval(pollInterval);
                    handlePaymentSuccess(data.details);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 5000);
    }

    function handlePaymentSuccess(details) {
        statusIndicator.className = 'status-indicator success';
        statusText.innerHTML = '✅ Payment Received!';
        pulseRing.classList.add('hidden');
        newPaymentBtn.classList.remove('hidden');
        
        if (details) {
            const payerDetailsDiv = document.getElementById('payer-details');
            payerDetailsDiv.innerHTML = '<h4 style="margin-bottom: 10px; color: var(--success-color);">Transaction Details</h4>';
            
            let foundAny = false;
            for (const [key, value] of Object.entries(details)) {
                // Ignore long hash strings to save space
                if (value && key !== 'hash' && key !== 'signature' && key !== 'md5') {
                    foundAny = true;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    payerDetailsDiv.innerHTML += `
                        <div class="payer-info-row">
                            <span>${label}</span> <strong>${value}</strong>
                        </div>
                    `;
                }
            }
            
            if (!foundAny) {
                payerDetailsDiv.innerHTML += `
                    <div class="payer-info-row">
                        <span>Status</span> <strong>No details provided by bank</strong>
                    </div>
                `;
            }
            payerDetailsDiv.classList.remove('hidden');
        }
        
        // Optional: Trigger a success animation (confetti, checkmark pop)
        qrImage.style.opacity = '0.5';
        
        // Trigger Khmer TTS
        playKhmerTTS(currentPayerName, currentAmount, currentPayerRemark);
    }
    
    async function playKhmerTTS(name, amount, remark) {
        let ttsText = `សូមអគុណសម្រាប់ ${amount} ដុល្លា`;
        if (name) {
            ttsText += ` ពី ${name}`;
        }
        if (remark) {
            ttsText += ` ${remark}`;
        }

        const formData = new URLSearchParams();
        formData.append('text', ttsText);
        formData.append('voice', 'km-KH-SreymomNeural');

        try {
            const res = await fetch('/tts', {
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) {
                console.log("TTS skipped or unavailable.");
                return;
            }
            
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        } catch (e) {
            console.error("TTS failed:", e);
        }
    }

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }
});
