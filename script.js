import weightliftingExercises from './exercises.js';

let exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];

function populateExerciseOptions(selectElement, onlyRecorded = false) {
    selectElement.innerHTML = '<option value="" disabled selected>Exercise</option>';
    const exercises = onlyRecorded ? [...new Set(exerciseData.map(entry => entry.exercise))] : weightliftingExercises;
    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise.replace(/-/g, ' ');
        selectElement.appendChild(option);
    });
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
            <select required>
                <option value="" disabled selected>Exercise</option>
            </select>
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
    weightInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });

    const validateBtn = logBody.querySelector('.validate-btn');
    validateBtn.addEventListener('click', validateRow);

    const dateInput = logBody.querySelector('#dateInput');
    dateInput.addEventListener('focus', function() {
        if (this.placeholder === 'Date') {
            this.placeholder = 'dd/mm/aaaa';
        }
    });
    dateInput.addEventListener('blur', function() {
        if (this.value === '') {
            this.placeholder = 'Date';
        }
    });
    dateInput.addEventListener('input', formatDateInput);
}

function formatDateInput(event) {
    let input = event.target.value;
    input = input.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Inicializa a máscara e os placeholders
    let day = 'dd', month = 'mm', year = 'aaaa';
    
    if (input.length >= 1) day = input.substring(0, 2).padEnd(2, 'd');
    if (input.length >= 3) month = input.substring(2, 4).padEnd(2, 'm');
    if (input.length >= 5) year = input.substring(4, 8).padEnd(4, 'a');

    // Constrói a máscara progressivamente
    let formattedDate = day + '/' + month + '/' + year;

    // Limita o comprimento da entrada ao necessário
    formattedDate = formattedDate.substring(0, 10);

    // Atualiza o valor do campo de entrada
    event.target.value = formattedDate;
}

function validateRow() {
    const logBody = document.getElementById('log-body');
    const dateInput = logBody.querySelector('#dateInput');
    const selectInput = logBody.querySelector('select');
    const weightInput = logBody.querySelector('input[type="number"]');

    // Verificação da data no formato DD/MM/AAAA
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateInput.value.match(datePattern)) {
        alert("Data inválida! Use o formato DD/MM/AAAA.");
        return;
    }

    // Converter data para AAAA-MM-DD para armazenamento
    const [day, month, year] = dateInput.value.split('/');
    const formattedDate = `${year}-${month}-${day}`;

    if (!selectInput.value || !weightInput.value) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    exerciseData.push({
        date: `${day}/${month}/${year}`, // Armazenar no formato desejado
        exercise: selectInput.value,
        weight: parseFloat(weightInput.value)
    });

    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));

    updateHistoryTable();
    updateReferenceTable();
    populateExerciseOptions(document.getElementById('exerciseSelect'), true);

    dateInput.value = selectInput.value = weightInput.value = "";
    logBody.querySelector('.validate-btn').disabled = true;

    addRow();
}

function updateHistoryTable() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = exerciseData.length === 0 ? 
        '<p style="text-align: center; color: #f0f0f0;">No data to show... 😔</p>' :
        `
            <h2>📜 Personal Record History</h2>
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Exercise</th>
                        <th>Weight</th>
                    </tr>
                </thead>
                <tbody id="history-body">
                    ${exerciseData.map(entry => `
                        <tr>
                            <td>${entry.date}</td>
                            <td>${entry.exercise.replace(/-/g, ' ')}</td>
                            <td>${entry.weight} kg</td>
                        </tr>
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
        const weightAtPercentage = maxWeight * (percentage / 100);
        return `
            <tr>
                <td>${percentage}</td>
                <td>${weightAtPercentage.toFixed(1)} kg</td>
            </tr>
        `;
    }).join('');

    const customPercentageInput = document.getElementById('customPercentageInput');
    const customWeightOutput = document.getElementById('customWeightOutput');

    function updateCustomWeight() {
        const customPercentage = customPercentageInput.value;
        if (customPercentage > 0 && customPercentage <= 100) {
            const weightAtCustomPercentage = maxWeight * (customPercentage / 100);
            customWeightOutput.textContent = `${weightAtCustomPercentage.toFixed(1)} kg`;
        } else {
            customWeightOutput.textContent = '-';
        }
    }

    customPercentageInput.removeEventListener('input', updateCustomWeight);
    customPercentageInput.addEventListener('input', updateCustomWeight); 
    document.getElementById('exerciseSelect').addEventListener('change', updateCustomWeight); 

    updateCustomWeight(); 
}

function checkRowCompletion(inputs) {
    const validateBtn = document.querySelector('.validate-btn');
    if (Array.from(inputs).every(input => input.value)) {
        validateBtn.disabled = false;
        validateBtn.style.backgroundColor = '';
        validateBtn.textContent = 'Submit';
    } else {
        validateBtn.disabled = true;
        validateBtn.style.backgroundColor = '#d32f2f';
        validateBtn.textContent = 'Incomplete Fields 😰';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const exerciseSelect = document.getElementById('exerciseSelect');
    populateExerciseOptions(exerciseSelect, true);
    addRow();
    updateHistoryTable();
    updateReferenceTable();
    exerciseSelect.addEventListener('change', updateReferenceTable);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
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

    let csvContent = "data:text/csv;charset=utf-8,Date,Exercise,Weight\n";
    exerciseData.forEach(entry => {
        csvContent += `${entry.date},${entry.exercise.replace(/-/g, ' ')},${entry.weight} kg\n`;
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "exercise_history.csv");
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

['clear-history-btn', 'export-csv-btn', 'delete-last-record-btn'].forEach(id => {
    document.getElementById(id).addEventListener('click', {
        'clear-history-btn': clearHistory,
        'export-csv-btn': exportHistoryAsCSV,
        'delete-last-record-btn': deleteLastRecord
    }[id]);
});

window.validateRow = validateRow;