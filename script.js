import weightliftingExercises from './exercises.js';

let exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];

function populateExerciseOptions(selectElement, onlyRecorded = false) {
    const exercises = onlyRecorded ? [...new Set(exerciseData.map(entry => entry.exercise))] : weightliftingExercises;
    selectElement.innerHTML = `<option value="" disabled selected>Exercise</option>` + 
        exercises.map(exercise => `<option value="${exercise}">${exercise.replace(/-/g, ' ')}</option>`).join('');
    selectElement.disabled = exercises.length === 0;
}

function addRow() {
    const logBody = document.getElementById('log-body');
    logBody.innerHTML = `
        <div class="input-group">
            <div class="input-icon">
                <i class="fas fa-calendar-alt"></i>
                <input type="text" id="dateInput" placeholder="Date" maxlength="10" required>
            </div>
        </div>
        <div class="input-group">
            <div class="input-icon">
                <i class="fas fa-dumbbell"></i>
                <select required></select>
            </div>
        </div>
        <div class="input-group">
            <div class="input-icon">
                <i class="fas fa-medal"></i>
                <input type="number" placeholder="PR Weight" min="0" step="0.1" required>
            </div>
        </div>
        <div class="input-group">
            <button class="validate-btn" disabled>Submit</button>
        </div>
    `;

    const selectElement = logBody.querySelector('select');
    populateExerciseOptions(selectElement);

    const inputs = logBody.querySelectorAll('input, select');
    inputs.forEach(input => input.addEventListener('input', () => checkRowCompletion(inputs)));

    const weightInput = logBody.querySelector('input[type="number"]');
    weightInput.addEventListener('input', () => { if (weightInput.value < 0) weightInput.value = 0; });

    logBody.querySelector('.validate-btn').addEventListener('click', validateRow);

    const dateInput = logBody.querySelector('#dateInput');
    flatpickr(dateInput, {
        dateFormat: "d/m/Y",
        allowInput: true,
        onChange: function(selectedDates, dateStr) {
            dateInput.value = dateStr;
            checkRowCompletion(inputs);
        }
    });

    dateInput.addEventListener('input', (event) => {
        formatDateInput(event);
    });
}

function formatDateInput(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); 
    let formattedValue = '';

    if (value.length === 0) {
        input.value = '';
        return;
    }

    if (value.length > 0) {
        let day = value.substring(0, 2);
        if (parseInt(day) > 31) day = '31';
        formattedValue = day;
    }

    if (value.length > 2) {
        let month = value.substring(2, 4);
        if (parseInt(month) > 12) month = '12';
        formattedValue += '/' + month;
    }

    if (value.length > 4) {
        let year = value.substring(4, 8);
        formattedValue += '/' + year;
    }

    input.value = formattedValue;
}

function validateRow() {
    const logBody = document.getElementById('log-body');
    const dateInput = logBody.querySelector('#dateInput');
    const selectInput = logBody.querySelector('select');
    const weightInput = logBody.querySelector('input[type="number"]');

    const [day, month, year] = dateInput.value.split('/');
    exerciseData.push({
        date: `${day}/${month}/${year}`,
        exercise: selectInput.value,
        weight: parseFloat(weightInput.value)
    });

    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));

    updateHistoryTable();
    updateReferenceTable();
    populateExerciseOptions(document.getElementById('exerciseSelect'), true);
    addRow();
}

function updateHistoryTable() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = exerciseData.length === 0 ? 
        '<p style="text-align: center; color: #f0f0f0;">No data to show.</p>' :
        `
            <h2>📜 Personal Record History</h2>
            <table class="history-table">
                <thead>
                    <tr><th>Date</th><th>Exercise</th><th>Weight</th></tr>
                </thead>
                <tbody>
                    ${exerciseData.map(entry => `
                        <tr><td>${entry.date}</td><td>${entry.exercise.replace(/-/g, ' ')}</td><td>${entry.weight} kg</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    populateExerciseOptions(document.getElementById('exerciseSelect'), true);
}

function updateReferenceTable() {
    const exercise = document.getElementById('exerciseSelect').value;
    const maxWeight = Math.max(...exerciseData.filter(entry => entry.exercise === exercise).map(entry => entry.weight), 0);

    document.getElementById('referencePercentages').innerHTML = Array.from({length: 10}, (_, i) => {
        const percentage = (i + 1) * 10;
        return `<tr><td>${percentage}</td><td>${(maxWeight * (percentage / 100)).toFixed(1)} kg</td></tr>`;
    }).join('');

    const customPercentageInput = document.getElementById('customPercentageInput');
    const customWeightOutput = document.getElementById('customWeightOutput');
    customPercentageInput.addEventListener('input', () => {
        const customPercentage = customPercentageInput.value;
        customWeightOutput.textContent = customPercentage > 0 && customPercentage <= 100 
            ? `${(maxWeight * (customPercentage / 100)).toFixed(1)} kg` 
            : '-';
    });
}

function checkRowCompletion(inputs) {
    const validateBtn = document.querySelector('.validate-btn');
    const allFieldsFilled = Array.from(inputs).every(input => input.value.trim() !== '');
    const allFieldsEmpty = Array.from(inputs).every(input => input.value.trim() === '');

    if (allFieldsFilled) {
        validateBtn.disabled = false;
        validateBtn.textContent = 'Ready to Submit'; 
        validateBtn.classList.remove('incomplete'); 
    } else {
        validateBtn.disabled = true;
        validateBtn.textContent = 'Incomplete Fields';
        validateBtn.classList.add('incomplete');

        if (allFieldsEmpty) {
            inputs.forEach(input => input.value = '');
            document.getElementById('dateInput').placeholder = 'Date';
            validateBtn.textContent = 'Submit';
            validateBtn.classList.remove('incomplete');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateExerciseOptions(document.getElementById('exerciseSelect'), true);
    addRow();
    updateHistoryTable();
    updateReferenceTable();
    document.getElementById('exerciseSelect').addEventListener('change', updateReferenceTable);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    });

    ['clear-history-btn', 'export-csv-btn', 'delete-last-record-btn'].forEach(id => {
        document.getElementById(id).addEventListener('click', {
            'clear-history-btn': clearHistory,
            'export-csv-btn': exportHistoryAsCSV,
            'delete-last-record-btn': deleteLastRecord
        }[id]);
    });
});

function clearHistory() {
    exerciseData = [];
    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
    updateHistoryTable();
    updateReferenceTable();
}

function exportHistoryAsCSV() {
    if (exerciseData.length === 0) {
        alert("No data to export.");
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8,Date,Exercise,Weight\n" +
        exerciseData.map(entry => `${entry.date},${entry.exercise.replace(/-/g, ' ')},${entry.weight} kg`).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "exercise_history.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteLastRecord() {
    if (exerciseData.length === 0) {
        alert("No records to delete.");
        return;
    }

    exerciseData.pop();
    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
    updateHistoryTable();
    updateReferenceTable();
}