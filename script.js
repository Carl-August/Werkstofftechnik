document.addEventListener('DOMContentLoaded', () => {
    const questionTextElement = document.getElementById('question-text');
    const answerButtonsElement = document.getElementById('answer-buttons');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    const quizArea = document.getElementById('quiz-area');
    const noQuestionsMessage = document.getElementById('no-questions-message');
    const showAddQuestionModalInitialBtn = document.getElementById('show-add-question-modal-initial');

    const addQuestionModal = document.getElementById('add-question-modal');
    const showAddQuestionModalBtn = document.getElementById('show-add-question-modal');
    const addQuestionModalFixedBtn = document.getElementById('show-add-question-modal'); // The FAB
    const closeModalBtn = document.querySelector('.close-button');
    const addQuestionForm = document.getElementById('add-question-form');

    const newQuestionInput = document.getElementById('new-question');
    const answer1Input = document.getElementById('answer1');
    const answer2Input = document.getElementById('answer2');
    const answer3Input = document.getElementById('answer3');
    const correctAnswerSelect = document.getElementById('correct-answer');

    let questions = [];
    let currentQuestionIndex = -1;
    let availableQuestionIndices = [];

    const QUESTIONS_STORAGE_KEY = 'quizQuestions';

    function loadQuestions() {
        const storedQuestions = localStorage.getItem(QUESTIONS_STORAGE_KEY);
        if (storedQuestions) {
            questions = JSON.parse(storedQuestions);
        } else {
            questions = []; // Start with an empty array if nothing is stored
        }

        if (questions.length === 0) {
            quizArea.classList.add('hidden');
            noQuestionsMessage.classList.remove('hidden');
            addQuestionModalFixedBtn.classList.remove('hidden'); // Ensure FAB is visible
        } else {
            noQuestionsMessage.classList.add('hidden');
            quizArea.classList.remove('hidden');
            addQuestionModalFixedBtn.classList.remove('hidden'); // Ensure FAB is visible
            resetAvailableQuestions();
            showRandomQuestion();
        }
    }

    function saveQuestions() {
        localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
    }

    function resetAvailableQuestions() {
        availableQuestionIndices = questions.map((_, index) => index);
    }

    function showRandomQuestion() {
        resetAnswerStyles();
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = ''; // Clear feedback classes
        nextQuestionBtn.classList.add('hidden');

        if (availableQuestionIndices.length === 0) {
            if (questions.length > 0) { // All questions answered, reset
                resetAvailableQuestions();
            } else { // No questions at all
                quizArea.classList.add('hidden');
                noQuestionsMessage.classList.remove('hidden');
                return;
            }
        }

        if (availableQuestionIndices.length === 0 && questions.length === 0) {
             // Should be caught by the above, but as a safeguard
            quizArea.classList.add('hidden');
            noQuestionsMessage.classList.remove('hidden');
            return;
        }


        const randomIndexInAvailable = Math.floor(Math.random() * availableQuestionIndices.length);
        currentQuestionIndex = availableQuestionIndices.splice(randomIndexInAvailable, 1)[0];

        const currentQuestion = questions[currentQuestionIndex];

        questionTextElement.textContent = currentQuestion.question;
        answerButtonsElement.innerHTML = ''; // Clear previous buttons

        currentQuestion.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.classList.add('btn', 'answer-btn');
            button.textContent = answer.text;
            button.dataset.correct = answer.correct;
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

    // Modal Logic
    function openModal() {
        addQuestionModal.classList.remove('hidden');
        addQuestionModal.style.display = "flex"; // Use flex for centering
        addQuestionModalFixedBtn.classList.add('hidden'); // Hide FAB when modal is open
    }

    function closeModal() {
        addQuestionModal.classList.add('hidden');
        addQuestionModal.style.display = "none";
        addQuestionForm.reset(); // Reset form on close
        // The FAB should reappear when the modal is closed.
        // Its general visibility (e.g. if no questions at all) is handled by loadQuestions
        // but when a user explicitly closes the modal, the button to re-open should be there.
        addQuestionModalFixedBtn.classList.remove('hidden');
    }

    showAddQuestionModalBtn.addEventListener('click', openModal);
    if(showAddQuestionModalInitialBtn) { // if it exists
        showAddQuestionModalInitialBtn.addEventListener('click', openModal);
    }
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { // Close if clicked outside
        if (event.target === addQuestionModal) {
            closeModal();
        }
    });

    addQuestionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const question = newQuestionInput.value.trim();
        const ans1Text = answer1Input.value.trim();
        const ans2Text = answer2Input.value.trim();
        const ans3Text = answer3Input.value.trim();
        const correctIdx = parseInt(correctAnswerSelect.value);

        if (!question || !ans1Text || !ans2Text || !ans3Text) {
            alert('Bitte fülle alle Felder aus!');
            return;
        }

        const newQuestion = {
            question: question,
            answers: [
                { text: ans1Text, correct: correctIdx === 0 },
                { text: ans2Text, correct: correctIdx === 1 },
                { text: ans3Text, correct: correctIdx === 2 }
            ]
        };

        questions.push(newQuestion);
        saveQuestions();
        closeModal();

        // If this was the first question added
        if (questions.length === 1) {
            loadQuestions(); // This will hide the message and show the quiz area
        } else {
            // No need to reload all, just update UI if needed or let next question handle it
            // For simplicity, we can just ensure the quiz area is visible
            noQuestionsMessage.classList.add('hidden');
            quizArea.classList.remove('hidden');
            if (currentQuestionIndex === -1 || availableQuestionIndices.length === 0) {
                resetAvailableQuestions(); // This will include the new question
                showRandomQuestion(); // Show a question immediately
            } else {
                // Add to available questions if a quiz is in progress and it's not already there
                // (resetAvailableQuestions would have added it if it was depleted)
                if (!availableQuestionIndices.includes(questions.length - 1)) {
                    availableQuestionIndices.push(questions.length - 1);
                }
                // Optional: if the 'next question' button is hidden (e.g. quiz just started, first q answered, then new one added)
                // then show a new random question. Otherwise, user will click 'next question'.
                if (nextQuestionBtn.classList.contains('hidden') && quizArea.classList.contains('hidden') == false) {
                     showRandomQuestion();
                }
            }
        }
        alert('Frage erfolgreich hinzugefügt!');
    });

    nextQuestionBtn.addEventListener('click', showRandomQuestion);

    // Initial load
    loadQuestions();
});
