document.addEventListener('DOMContentLoaded', () => {
    const questionTextElement = document.getElementById('question-text');
    const answerButtonsElement = document.getElementById('answer-buttons');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    // Areas
    const quizArea = document.getElementById('quiz-area');
    const noQuestionsMessage = document.getElementById('no-questions-message');
    const noCatalogMessage = document.getElementById('no-catalog-message'); // New

    // Add Question Modal
    const addQuestionModal = document.getElementById('add-question-modal');
    const showAddQuestionModalBtn = document.getElementById('show-add-question-modal'); // FAB
    const showAddQuestionModalInitialBtn = document.getElementById('show-add-question-modal-initial'); // Button in no-questions message
    const closeAddQuestionModalBtn = document.querySelector('.close-add-question-modal');
    const addQuestionForm = document.getElementById('add-question-form');
    const newQuestionInput = document.getElementById('new-question');
    const correctAnswerTextInput = document.getElementById('correct-answer-text'); // New

    // Answer Catalog Modal
    const answerCatalogModal = document.getElementById('answer-catalog-modal'); // New
    const showAnswerCatalogModalBtn = document.getElementById('show-answer-catalog-modal-btn'); // New FAB
    const closeAnswerCatalogModalBtn = document.querySelector('.close-answer-catalog-modal'); // New
    const addCatalogAnswerForm = document.getElementById('add-catalog-answer-form'); // New
    const newCatalogAnswerInput = document.getElementById('new-catalog-answer'); // New
    const answerCatalogListElement = document.getElementById('answer-catalog-list'); // New
    const emptyCatalogInfoElement = document.getElementById('empty-catalog-info'); // New

    const addQuestionModalFixedBtn = document.getElementById('show-add-question-modal'); // Reference to the FAB for hiding/showing

    let questions = [];
    let answerCatalog = []; // New
    let currentQuestionIndex = -1;
    let availableQuestionIndices = [];

    const WERKSTOFFQUIZ_QUESTIONS_KEY = 'werkstoffquizQuestions'; // Renamed
    const ANSWERS_CATALOG_KEY = 'werkstoffquizAnswerCatalog'; // New
    const MIN_CATALOG_ANSWERS = 2; // Minimum distractors needed from catalog

    function loadData() {
        const storedQuestions = localStorage.getItem(WERKSTOFFQUIZ_QUESTIONS_KEY);
        questions = storedQuestions ? JSON.parse(storedQuestions) : [];

        const storedCatalog = localStorage.getItem(ANSWERS_CATALOG_KEY);
        answerCatalog = storedCatalog ? JSON.parse(storedCatalog) : [];
        // Pre-fill catalog with some Werkstofftechnik examples if empty for demo purposes
        if (answerCatalog.length === 0) {
            answerCatalog = [
                "Polyethylen (PE)", "Polytetrafluorethylen (PTFE)", "Aluminiumoxid (Al2O3)",
                "Siliciumcarbid (SiC)", "Baustahl (S235JR)", "Messing (CuZn37)",
                "Titan Grad 5 (Ti-6Al-4V)", "Glasfaserverstärkter Kunststoff (GFK)",
                "Kohlenstofffaserverstärkter Kunststoff (CFK)", "Holz (Fichte)", "Beton C25/30",
                "Kupfer (Cu)", "Magnesium (Mg)", "Zink (Zn)", "Nickel (Ni)", "Chrom (Cr)",
                "Wolfram (W)", "Keramik", "Gummi", "Leder"
            ];
            saveAnswerCatalog();
        }

        updateUIConditionally();
    }

    function updateUIConditionally() {
        if (questions.length === 0) {
            quizArea.classList.add('hidden');
            noQuestionsMessage.classList.remove('hidden');
            addQuestionModalFixedBtn.classList.remove('hidden');
        } else {
            noQuestionsMessage.classList.add('hidden');
            quizArea.classList.remove('hidden');
            addQuestionModalFixedBtn.classList.remove('hidden');
            resetAvailableQuestions();
            showRandomQuestion();
        }
        checkCatalogStatus();
        renderAnswerCatalogList(); // Keep catalog list updated in its modal
    }

    function saveQuestions() {
        localStorage.setItem(WERKSTOFFQUIZ_QUESTIONS_KEY, JSON.stringify(questions));
    }

    function saveAnswerCatalog() { // New
        localStorage.setItem(ANSWERS_CATALOG_KEY, JSON.stringify(answerCatalog));
        checkCatalogStatus();
        renderAnswerCatalogList();
    }

    function checkCatalogStatus() { // New
        if (answerCatalog.length < MIN_CATALOG_ANSWERS) {
            noCatalogMessage.classList.remove('hidden');
        } else {
            noCatalogMessage.classList.add('hidden');
        }
    }

    function resetAvailableQuestions() {
        availableQuestionIndices = questions.map((_, index) => index);
    }

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function showRandomQuestion() {
        resetAnswerStyles();
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = '';
        nextQuestionBtn.classList.add('hidden');

        if (questions.length === 0) {
            updateUIConditionally(); // Handles showing "no questions" message
            return;
        }

        if (answerCatalog.length < MIN_CATALOG_ANSWERS) {
            questionTextElement.textContent = "Bitte fügen Sie dem Antwortkatalog genügend (mind. "+MIN_CATALOG_ANSWERS+") Antworten hinzu.";
            answerButtonsElement.innerHTML = '';
            checkCatalogStatus(); // Ensure message is visible
            return;
        }

        if (availableQuestionIndices.length === 0) {
            resetAvailableQuestions();
        }

        const randomIndexInAvailable = Math.floor(Math.random() * availableQuestionIndices.length);
        currentQuestionIndex = availableQuestionIndices.splice(randomIndexInAvailable, 1)[0];

        const currentQuestionData = questions[currentQuestionIndex];
        questionTextElement.textContent = currentQuestionData.question;

        // Prepare answer choices
        let answerChoices = [{ text: currentQuestionData.correctAnswer, correct: true }];

        // Get distractors
        let distractors = [];
        let catalogCopy = [...answerCatalog]; // Work with a copy to avoid modifying original

        // Filter out the correct answer from potential distractors
        catalogCopy = catalogCopy.filter(ans => ans.toLowerCase() !== currentQuestionData.correctAnswer.toLowerCase());

        if (catalogCopy.length < MIN_CATALOG_ANSWERS) {
             questionTextElement.textContent = `Nicht genügend unterschiedliche Distraktoren im Katalog für Frage: "${currentQuestionData.question}". Benötigt: ${MIN_CATALOG_ANSWERS}, Verfügbar (ohne korrekte Antwort): ${catalogCopy.length}. Bitte Katalog erweitern.`;
             answerButtonsElement.innerHTML = '';
             return;
        }

        // Shuffle catalogCopy to get random distractors
        shuffleArray(catalogCopy);

        for (let i = 0; i < MIN_CATALOG_ANSWERS && i < catalogCopy.length; i++) {
            distractors.push({ text: catalogCopy[i], correct: false });
        }

        answerChoices = answerChoices.concat(distractors);
        shuffleArray(answerChoices); // Shuffle for display

        answerButtonsElement.innerHTML = ''; // Clear previous buttons
        answerChoices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('btn', 'answer-btn');
            button.textContent = choice.text;
            button.dataset.correct = choice.correct;
            button.addEventListener('click', selectAnswer);
            answerButtonsElement.appendChild(button);
        });
    }

    function selectAnswer(e) {
        const selectedButton = e.target;
        const isCorrect = selectedButton.dataset.correct === 'true';

        Array.from(answerButtonsElement.children).forEach(button => {
            button.disabled = true; // Disable all buttons after an answer
            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            } else {
                button.classList.add('wrong');
            }
        });

        if (isCorrect) {
            feedbackTextElement.textContent = 'Richtig!';
            feedbackTextElement.className = 'correct';
        } else {
            feedbackTextElement.textContent = 'Falsch!';
            feedbackTextElement.className = 'wrong';
            // Highlight the correct answer even if the user was wrong
            // The loop above already styles all buttons, so this is more about the text.
        }
        nextQuestionBtn.classList.remove('hidden');
    }

    function resetAnswerStyles() {
        Array.from(answerButtonsElement.children).forEach(button => {
            button.classList.remove('correct', 'wrong');
            button.disabled = false;
        });
    }

    // --- Modal Logic ---

    // Add Question Modal
    function openAddQuestionModal() {
        addQuestionModal.classList.remove('hidden');
        addQuestionModal.style.display = "flex";
        addQuestionModalFixedBtn.classList.add('hidden'); // Hide main "add question" FAB
        showAnswerCatalogModalBtn.classList.add('hidden'); // Hide "manage catalog" FAB
    }

    function closeAddQuestionModal() {
        addQuestionModal.classList.add('hidden');
        addQuestionModal.style.display = "none";
        addQuestionForm.reset();
        addQuestionModalFixedBtn.classList.remove('hidden'); // Show main "add question" FAB
        showAnswerCatalogModalBtn.classList.remove('hidden'); // Show "manage catalog" FAB
    }

    showAddQuestionModalBtn.addEventListener('click', openAddQuestionModal);
    if (showAddQuestionModalInitialBtn) {
        showAddQuestionModalInitialBtn.addEventListener('click', openAddQuestionModal);
    }
    closeAddQuestionModalBtn.addEventListener('click', closeAddQuestionModal);

    addQuestionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionText = newQuestionInput.value.trim();
        const correctAnswer = correctAnswerTextInput.value.trim();

        if (!questionText || !correctAnswer) {
            alert('Bitte fülle alle Felder aus (Frage und korrekte Antwort)!');
            return;
        }
        // Check if correct answer is in catalog; if not, add it.
        // This ensures the correct answer can also be a distractor for other questions if desired.
        const lowerCaseCorrectAnswer = correctAnswer.toLowerCase();
        if (!answerCatalog.some(ans => ans.toLowerCase() === lowerCaseCorrectAnswer)) {
            answerCatalog.push(correctAnswer);
            // saveAnswerCatalog() will be called by updateUIConditionally or directly after this block
        }

        const newQuestion = {
            question: questionText,
            correctAnswer: correctAnswer
        };

        questions.push(newQuestion);
        saveQuestions();
        saveAnswerCatalog(); // Save catalog in case correct answer was added & to update its view
        closeAddQuestionModal();

        updateUIConditionally(); // Handles UI update based on new question count and catalog status
        alert('Frage erfolgreich hinzugefügt!');
    });

    // Answer Catalog Modal
    function openAnswerCatalogModal() {
        answerCatalogModal.classList.remove('hidden');
        answerCatalogModal.style.display = "flex";
        renderAnswerCatalogList(); // Make sure list is up-to-date when opening
        addQuestionModalFixedBtn.classList.add('hidden');  // Hide main "add question" FAB
        showAnswerCatalogModalBtn.classList.add('hidden'); // Hide "manage catalog" FAB
    }

    function closeAnswerCatalogModal() {
        answerCatalogModal.classList.add('hidden');
        answerCatalogModal.style.display = "none";
        addCatalogAnswerForm.reset();
        addQuestionModalFixedBtn.classList.remove('hidden'); // Show main "add question" FAB
        showAnswerCatalogModalBtn.classList.remove('hidden'); // Show "manage catalog" FAB
    }

    function renderAnswerCatalogList() {
        answerCatalogListElement.innerHTML = ''; // Clear existing list
        if (answerCatalog.length === 0) {
            emptyCatalogInfoElement.classList.remove('hidden');
        } else {
            emptyCatalogInfoElement.classList.add('hidden');
            answerCatalog.forEach(answer => {
                const li = document.createElement('li');
                li.textContent = answer;
                // Optional: Add a delete button for each catalog item
                // const deleteBtn = document.createElement('button');
                // deleteBtn.textContent = 'X';
                // deleteBtn.onclick = () => deleteCatalogAnswer(answer);
                // li.appendChild(deleteBtn);
                answerCatalogListElement.appendChild(li);
            });
        }
    }

    showAnswerCatalogModalBtn.addEventListener('click', openAnswerCatalogModal);
    closeAnswerCatalogModalBtn.addEventListener('click', closeAnswerCatalogModal);

    addCatalogAnswerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAnswer = newCatalogAnswerInput.value.trim();
        if (newAnswer && !answerCatalog.some(ans => ans.toLowerCase() === newAnswer.toLowerCase())) {
            answerCatalog.push(newAnswer);
            saveAnswerCatalog(); // This also calls renderAnswerCatalogList
            newCatalogAnswerInput.value = ''; // Clear input
        } else if (!newAnswer) {
            alert("Die Antwort darf nicht leer sein.");
        } else {
            alert("Diese Antwort ist bereits im Katalog vorhanden.");
        }
    });

    // Generic modal closing by clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === addQuestionModal) {
            closeAddQuestionModal();
        }
        if (event.target === answerCatalogModal) {
            closeAnswerCatalogModal();
        }
    });

    nextQuestionBtn.addEventListener('click', showRandomQuestion);

    // Initial load
    loadData(); // Changed from loadQuestions to loadData
});
