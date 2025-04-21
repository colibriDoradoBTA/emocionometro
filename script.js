// script.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('emotionForm');
    const intensityInput = document.getElementById('intensity');
    const intensityValueSpan = document.getElementById('intensityValue');
    const bodymapPronaImg = document.getElementById('bodymap-prona');
    const bodymapSupinaImg = document.getElementById('bodymap-supina');
    const markersPronaDiv = document.getElementById('markers-prona');
    const markersSupinaDiv = document.getElementById('markers-supina');
    const clearMarkersButton = document.querySelector('.btn-clear-markers');
    const detectedEmotionInput = document.getElementById('detectedEmotion'); // Read-only field
    // YOUR GOOGLE APPS SCRIPT WEB APP URL - REPLACED WITH PROVIDED URL
    const googleAppsScriptURL = 'https://script.google.com/macros/s/AKfycbzhHBKwZ4xrYmo6uG_oZeoIKq9FVYc-Q4x-tRKoJs0iLK4wFptTyrEN8gC_blF_8t1l/exec';

    let pronaMarkers = []; // Stores { x: relativeX, y: relativeY, element: markerDiv }
    let supinaMarkers = []; // Stores { x: relativeX, y: relativeY, element: markerDiv }

    // --- Helper Functions ---

    // Update intensity value display next to slider
    const updateIntensityValue = () => {
        intensityValueSpan.textContent = intensityInput.value;
    };

    // Add marker to body map
    const addMarker = (event, markersArray, markersDiv, imgElement) => {
        // Ensure it's a left click and not on an existing marker
        if (event.button !== 0 || event.target !== imgElement) {
             return;
        }

        // Get click position relative to the image container
        const rect = imgElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate relative coordinates (percentage)
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;

        // Prevent placing markers too close together (optional debounce/throttling)
        // Simple check for demonstration: don't add if very close to last one
         if (markersArray.length > 0) {
            const lastMarker = markersArray[markersArray.length - 1];
            // Need to parse the stored string coordinates back to numbers for calculation
            const dx = relativeX - parseFloat(lastMarker.x);
            const dy = relativeY - parseFloat(lastMarker.y);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 1.5) { // Threshold in percentage
                return;
            }
        }

        // Create marker element
        const marker = document.createElement('div');
        marker.classList.add('marker');
        marker.style.left = `${relativeX}%`;
        marker.style.top = `${relativeY}%`;

        // Store relative coordinates and marker element, formatted for storage
        const markerData = { x: relativeX.toFixed(2), y: relativeY.toFixed(2), element: marker };
        markersArray.push(markerData);

        // Append marker to the overlay div
        markersDiv.appendChild(marker);

        // Add listener to remove marker on click
        marker.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click bubbling to image
            removeMarker(markerData, markersArray, markersDiv);
            updateDetectedEmotion(); // Update AI field after marker change
        });

        // Add a title for accessibility/info
        marker.title = `Coordenada: (${markerData.x}%, ${markerData.y}%)`;

        // Update AI field after marker change
        updateDetectedEmotion();
    };

    // Remove marker from body map
    const removeMarker = (markerData, markersArray, markersDiv) => {
         // Remove from DOM
        if (markerData.element && markerData.element.parentNode === markersDiv) {
             markersDiv.removeChild(markerData.element);
        }
        // Remove from array
        const index = markersArray.indexOf(markerData);
        if (index > -1) {
            markersArray.splice(index, 1);
        }
    };

    // Clear all markers
    const clearMarkers = () => {
        pronaMarkers.forEach(m => { if (m.element && m.element.parentNode) m.element.parentNode.removeChild(m.element); });
        supinaMarkers.forEach(m => { if (m.element && m.element.parentNode) m.element.parentNode.removeChild(m.element); });
        pronaMarkers = [];
        supinaMarkers = [];
        updateDetectedEmotion(); // Update AI field after clearing
    };

    // --- Placeholder for AI Detection Logic ---
    // This function updates the detected emotion field based on user input.
    // In a real application, this would call a backend AI service.
    const updateDetectedEmotion = () => {
        const selectedEmotions = Array.from(document.getElementById('emotions').selectedOptions).map(option => option.value);
        const intensity = intensityInput.value;
        const comfortLevel = document.querySelector('input[name="comfortLevel"]:checked')?.value;
        const hasBodyMarkers = pronaMarkers.length > 0 || supinaMarkers.length > 0;
        const labels = Array.from(document.querySelectorAll('input[name="semanticLabels"]:checked')).map(input => input.value);
        const trigger = document.getElementById('triggerEvent').value.trim();

        let detectionText = "Esperando datos de análisis...";

        // Simple logic: prioritize based on what's filled
        if (selectedEmotions.length > 0) {
             const emotionNames = selectedEmotions.map(val => {
                 // Map value back to display text for clarity
                 const option = document.querySelector(`#emotions option[value="${val}"]`);
                 return option ? option.textContent : val;
             });
             detectionText = `Emoción(es): ${emotionNames.join(', ')}`;
             if (intensity && intensity !== '3') detectionText += ` (Intensidad: ${intensity})`;
        } else if (labels.length > 0) {
             detectionText = `Etiquetas: ${labels.join(', ')}`;
        } else if (hasBodyMarkers) {
             detectionText = "Sensación Corporal Detectada";
        } else if (comfortLevel) {
             detectionText = `Nivel de Confort: ${comfortLevel}`;
        } else if (trigger.length > 0) {
             // Limit trigger text length in the display field
             detectionText = `Evento: "${trigger.substring(0, 30)}${trigger.length > 30 ? '...' : ''}"`;
        } else {
             detectionText = "Esperando datos de análisis...";
        }

        detectedEmotionInput.value = detectionText;
        // In a real app, this function might instead make an API call to an AI service
        // and then update the field with the result from the API.
    };


    // --- Event Listeners ---

    // Listen for intensity slider changes
    intensityInput.addEventListener('input', () => {
        updateIntensityValue();
        updateDetectedEmotion(); // Update AI field when intensity changes
    });

    // Listen for clicks on bodymap images
    bodymapPronaImg.addEventListener('click', (event) => {
        addMarker(event, pronaMarkers, markersPronaDiv, bodymapPronaImg);
    });

    bodymapSupinaImg.addEventListener('click', (event) => {
        addMarker(event, supinaMarkers, markersSupinaDiv, bodymapSupinaImg);
    });

    // Listen for clear markers button
    clearMarkersButton.addEventListener('click', clearMarkers);


    // Listen for changes in other input fields to update AI prediction placeholder
    document.getElementById('emotions').addEventListener('change', updateDetectedEmotion);
    document.querySelectorAll('input[name="comfortLevel"]').forEach(input => input.addEventListener('change', updateDetectedEmotion));
    document.querySelectorAll('input[name="semanticLabels"]').forEach(input => input.addEventListener('change', updateDetectedEmotion));
    document.getElementById('triggerEvent').addEventListener('input', updateDetectedEmotion); // Using 'input' for real-time update
    document.getElementById('userName').addEventListener('input', updateDetectedEmotion);


    // Listen for form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default page reload

        // --- Collect Form Data ---
        const formData = new FormData(form);
        const data = {};

        // Collect simple key-value pairs
        formData.forEach((value, key) => {
            // Skip multi-selects and checkboxes here, handled separately
            if (key !== 'emotions' && key !== 'semanticLabels') {
                data[key] = value;
            }
        });

        // Handle multi-select (Emotions)
        const selectedEmotions = Array.from(document.getElementById('emotions').selectedOptions).map(option => option.value);
        data['emotions'] = selectedEmotions;

        // Handle multi-select checkboxes (Semantic Labels)
        const selectedLabels = Array.from(document.querySelectorAll('input[name="semanticLabels"]:checked')).map(input => input.value);
        data['semanticLabels'] = selectedLabels;

        // Add body map marker data (only coordinates)
        // We store the {x, y} objects directly, not the element
        data['bodymapProna'] = pronaMarkers.map(m => ({ x: m.x, y: m.y }));
        data['bodymapSupina'] = supinaMarkers.map(m => ({ x: m.x, y: m.y }));

        // Add Detected Emotion value (whatever is currently in the readonly field)
        data['detectedEmotion'] = detectedEmotionInput.value;

        console.log('Submitting Data:', data); // Log data being sent to verify structure

        // --- AJAX Submission ---
        if (googleAppsScriptURL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' || googleAppsScriptURL === '') {
             alert('ERROR: La URL de Google Apps Script no está configurada correctamente.');
             console.error('Google Apps Script URL not configured.');
             return;
        }

        try {
            // Using fetch API to send JSON data
            const response = await fetch(googleAppsScriptURL, {
                method: 'POST',
                // 'no-cors' is typically required for POST requests to Google Apps Script web apps
                // deployed to execute as 'Me' and accessed by 'Anyone, even anonymous'.
                // It prevents the browser from blocking the request due to CORS,
                // but also means you cannot read the actual response content or status reliably (status will be 0).
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                    // Note: In 'no-cors' mode, most custom headers are not allowed.
                    // 'Content-Type: application/json' is one of the few allowed.
                },
                body: JSON.stringify(data),
            });

            // In 'no-cors' mode, we cannot reliably check response.ok or response.status.
            // The fetch promise resolves even for HTTP errors (like 404) if the network doesn't fail.
            // We primarily rely on the Apps Script Execution Logs to confirm success or failure.
            console.log('Fetch attempt finished. Note: Status is often 0 in no-cors mode, cannot confirm backend success here.');

             // Give immediate user feedback assuming the fetch call didn't throw a network error
            alert('Registro enviado (ver logs de Apps Script para confirmación).');

            // --- Reset Form ---
            form.reset();
            clearMarkers(); // Clear body map markers
            updateIntensityValue(); // Reset slider value display (usually to 3 by default)
            // Detected emotion will be updated by the input change listener after reset
             // Need to manually reset it if default value isn't set via HTML
             detectedEmotionInput.value = "Esperando datos de análisis...";


        } catch (error) {
            // This catch block primarily handles network errors (e.g., URL unreachable)
            console.error('Error during form submission:', error);
            alert('Hubo un error de red al enviar el registro. Consulta la consola para más detalles.');
        }

        // Re-run AI update after reset to ensure placeholder text is correct
         updateDetectedEmotion();
    });

    // --- Initial Setup ---
    updateIntensityValue(); // Set initial value display for slider

    // Initial call to set the AI field text on page load
     updateDetectedEmotion();
});