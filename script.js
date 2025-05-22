document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const questionCountSelect = document.getElementById('question-count');
    const categorySelect = document.getElementById('category-select');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const questionElement = document.getElementById('question');
    const answersContainer = document.getElementById('answers');
    const resultText = document.getElementById('result-text');
    const wrongAnswersList = document.getElementById('wrong-answers');
    const restartBtn = document.getElementById('restart-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Данные и состояние
    let allQuestions = {};
    let shuffledQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let totalQuestions = 0;

    // Встроенные вопросы (на случай проблем с загрузкой)
    const defaultQuestions = {
        "Терминология": [
            {
                "question": "Пример вопроса 1",
                "answer1": "Ответ 1",
                "answer2": "Ответ 2",
                "answer3": "Ответ 3",
                "answer4": "Ответ 4",
                "correct": "answer1"
            }
        ]
    };

    // Загрузка вопросов
    function loadQuestions() {
        // Пробуем загрузить из JSON
        return fetch('zapretki.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .catch(error => {
                console.error('Error loading JSON, using default questions:', error);
                return defaultQuestions;
            });
    }

    // Инициализация приложения
    async function init() {
        allQuestions = await loadQuestions();
        populateCategorySelect();
        updateQuestionCountOptions();
    }

    // Заполнение выбора категорий
    function populateCategorySelect() {
        categorySelect.innerHTML = '';
        
        const allOption = new Option('Все разделы (в перемешанном порядке)', 'all');
        categorySelect.add(allOption);

        for (const category in allQuestions) {
            const option = new Option(category, category);
            categorySelect.add(option);
        }
        
        categorySelect.selectedIndex = 0;
    }

    // Обновление количества вопросов
    function updateQuestionCountOptions() {
        questionCountSelect.innerHTML = '';

        const selectedCategory = categorySelect.value;
        let maxQuestions = 0;

        if (selectedCategory === 'all') {
            for (const category in allQuestions) {
                maxQuestions += allQuestions[category].length;
            }
        } else {
            maxQuestions = allQuestions[selectedCategory].length;
        }

        // Максимальное количество вопросов - до 100 или все доступные
        maxQuestions = Math.min(maxQuestions, 100);

        for (let i = 1; i <= maxQuestions; i++) {
            const option = new Option(i, i);
            questionCountSelect.add(option);
        }

        // Устанавливаем либо 30, либо максимальное количество, если их меньше
        questionCountSelect.value = Math.min(30, maxQuestions);
    }

    // Начало теста
    function startQuiz() {
        const selectedCategory = categorySelect.value;
        totalQuestions = parseInt(questionCountSelect.value);

        // Собираем все вопросы из выбранной категории
        let questions = [];
        if (selectedCategory === 'all') {
            for (const category in allQuestions) {
                questions = questions.concat(allQuestions[category]);
            }
        } else {
            questions = allQuestions[selectedCategory];
        }

        // Если запрошено больше, чем есть - берем все
        totalQuestions = Math.min(totalQuestions, questions.length);

        // Перемешиваем вопросы
        shuffledQuestions = [...questions]
            .sort(() => Math.random() - 0.5)
            .slice(0, totalQuestions);

        // Перемешиваем ответы для каждого вопроса
        shuffledQuestions.forEach(question => {
            const answers = [
                { text: question.answer1, correct: question.correct === 'answer1' },
                { text: question.answer2, correct: question.correct === 'answer2' },
                { text: question.answer3, correct: question.correct === 'answer3' },
                { text: question.answer4, correct: question.correct === 'answer4' }
            ];
            
            question.shuffledAnswers = answers.sort(() => Math.random() - 0.5);
        });

        // Сбрасываем состояние
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        
        // Показываем первый вопрос
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        showQuestion();
    }

    // Показ вопроса
    function showQuestion() {
        resetState();
        const question = shuffledQuestions[currentQuestionIndex];
        questionElement.textContent = question.question;
        
        question.shuffledAnswers.forEach(answer => {
            const button = document.createElement('button');
            button.textContent = answer.text;
            button.classList.add('answer-btn');
            button.dataset.correct = answer.correct;
            button.addEventListener('click', selectAnswer);
            answersContainer.appendChild(button);
        });
        
        updateProgress();
    }

    // Очистка состояния
    function resetState() {
        nextBtn.classList.add('hidden');
        while (answersContainer.firstChild) {
            answersContainer.removeChild(answersContainer.firstChild);
        }
    }

    // Обработка выбора ответа
    function selectAnswer(e) {
        const selectedButton = e.target;
        const isCorrect = selectedButton.dataset.correct === 'true';
        
        // Сохраняем ответ пользователя
        userAnswers.push({
            question: shuffledQuestions[currentQuestionIndex].question,
            userAnswer: selectedButton.textContent,
            correctAnswer: shuffledQuestions[currentQuestionIndex][shuffledQuestions[currentQuestionIndex].correct],
            isCorrect: isCorrect
        });
        
        // Подсвечиваем ответы
        Array.from(answersContainer.children).forEach(button => {
            button.disabled = true;
            button.classList.add(button.dataset.correct === 'true' ? 'correct' : 'wrong');
        });
        
        if (isCorrect) score++;
        
        // Показываем кнопку "Далее" или "Завершить"
        nextBtn.classList.remove('hidden');
        if (currentQuestionIndex === shuffledQuestions.length - 1) {
            nextBtn.textContent = 'Завершить';
        }
    }

    // Переход к следующему вопросу
    function goToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < shuffledQuestions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }

    // Показ результатов
    function showResults() {
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        const percentage = Math.round((score / totalQuestions) * 100);
        resultText.textContent = `Вы ответили правильно на ${score} из ${totalQuestions} вопросов (${percentage}%)`;
        
        // Показываем неправильные ответы
        wrongAnswersList.innerHTML = '';
        userAnswers.forEach((answer, index) => {
            if (!answer.isCorrect) {
                const question = shuffledQuestions[index];
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>Вопрос ${index + 1}:</strong> ${answer.question}<br>
                    <span class="wrong-answer">Ваш ответ: ${answer.userAnswer}</span><br>
                    <span class="correct-answer">Правильный ответ: ${question[question.correct]}</span>
                `;
                wrongAnswersList.appendChild(li);
            }
        });
    }

    // Перезапуск теста
    function restartQuiz() {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }

    // Обновление прогресса
    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${totalQuestions}`;
    }

    // Обработчики событий
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', goToNextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
    categorySelect.addEventListener('change', updateQuestionCountOptions);

    // Инициализация
    init();
});