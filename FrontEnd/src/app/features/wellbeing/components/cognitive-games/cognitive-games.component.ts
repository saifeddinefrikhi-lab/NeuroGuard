import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { WellbeingService } from '../../services/wellbeing.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-cognitive-games',
    standalone: false,
    templateUrl: './cognitive-games.component.html',
    styleUrls: ['./cognitive-games.component.scss']
})
export class CognitiveGamesComponent implements OnInit, OnDestroy {
    games = [
        { id: 'MEMORY', name: 'Memory Match', icon: 'ti ti-grid', lastScore: 0, trend: 'neutral', color: '#4099ff' },
        { id: 'ORIENTATION', name: 'Orientation Check', icon: 'ti ti-compass', lastScore: 0, trend: 'neutral', color: '#2ed8b6' },
        { id: 'WORD_RECALL', name: 'Word Recall', icon: 'ti ti-type', lastScore: 0, trend: 'neutral', color: '#ffb64d' }
    ];

    activeGameId: string | null = null;
    gameState: 'intro' | 'playing' | 'result' = 'intro';
    
    // Game Data
    gameScore = 0;
    gameStartTime: number = 0;
    resultMessage = '';

    
    // Memory Match State
    memoryCards: any[] = [];
    flippedCards: any[] = [];
    matchedPairs = 0;
    wrongMatches = 0;
    
    // Orientation State
    currentQuestionIndex = 0;
    orientationQuestions = [
        { q: 'What day of the week is it today?', a: '', options: [], type: 'day' },
        { q: 'What is the current month?', a: '', options: [], type: 'month' },
        { q: 'Which season are we currently in?', a: '', options: [], type: 'season' }
    ];
    
    // Word Recall State
    recallWords = ['Apple', 'River', 'Table', 'Cloud', 'Smile'];
    recallOptions: string[] = [];
    selectedRecallWords: string[] = [];
    recallPhase: 'memorize' | 'recall' = 'memorize';
    recallTimer: any;
    recallTimeLeft = 10;

    constructor(
        private wellbeingService: WellbeingService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadLastScores();
    }

    ngOnDestroy() {
        if (this.recallTimer) clearInterval(this.recallTimer);
    }

    loadLastScores() {
        const userId = this.authService.currentUser?.userId;
        if (userId) {
            this.wellbeingService.getGameResults(userId.toString()).subscribe(results => {
                this.games.forEach(game => {
                    const gameResults = results.filter(r => r.gameType === game.id);
                    if (gameResults.length > 0) {
                        game.lastScore = gameResults[0].score;
                        if (gameResults.length > 1) {
                            game.trend = gameResults[0].score >= gameResults[1].score ? 'up' : 'down';
                        }
                    }
                });
            });
        }
    }

    startGame(gameId: string) {
        this.activeGameId = gameId;
        this.gameState = 'playing';
        this.gameScore = 0;
        this.gameStartTime = Date.now();

        if (gameId === 'MEMORY') this.initMemoryGame();
        if (gameId === 'ORIENTATION') this.initOrientationGame();
        if (gameId === 'WORD_RECALL') this.initWordRecallGame();
    }

    // --- Memory Match Logic ---
    initMemoryGame() {
        const emojis = ['🍎', '🐶', '🍕', '🚗', '🌈', '🎸', '⚽', '🚀'];
        const deck = [...emojis, ...emojis];
        this.memoryCards = deck.sort(() => Math.random() - 0.5).map((emoji, index) => ({
            id: index,
            emoji,
            flipped: false,
            matched: false
        }));
        this.matchedPairs = 0;
        this.wrongMatches = 0;
        this.flippedCards = [];
    }

    flipCard(card: any) {
        if (this.flippedCards.length === 2 || card.flipped || card.matched) return;

        card.flipped = true;
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        if (card1.emoji === card2.emoji) {
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
            this.flippedCards = [];
            if (this.matchedPairs === 8) {
                // Calculation: Start with 100, subtract 5 per wrong match. Min score 10.
                const finalScore = Math.max(10, 100 - (this.wrongMatches * 5));
                this.finishGame(finalScore);
            }
        } else {
            this.wrongMatches++;
            setTimeout(() => {
                card1.flipped = false;
                card2.flipped = false;
                this.flippedCards = [];
                this.cdr.detectChanges();
            }, 1000);
        }
    }

    // --- Orientation Logic ---
    initOrientationGame() {
        this.currentQuestionIndex = 0;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

        this.orientationQuestions[0].options = this.shuffle([...days]).slice(0, 4);
        const correctDay = days[new Date().getDay()];
        if (!this.orientationQuestions[0].options.includes(correctDay)) this.orientationQuestions[0].options[0] = correctDay;
        this.orientationQuestions[0].options = this.shuffle(this.orientationQuestions[0].options);

        this.orientationQuestions[1].options = this.shuffle([...months]).slice(0, 4);
        const correctMonth = months[new Date().getMonth()];
        if (!this.orientationQuestions[1].options.includes(correctMonth)) this.orientationQuestions[1].options[0] = correctMonth;
        this.orientationQuestions[1].options = this.shuffle(this.orientationQuestions[1].options);

        this.orientationQuestions[2].options = this.shuffle([...seasons]);
        
        this.gameScore = 0;
    }

    answerOrientation(option: string) {
        const q = this.orientationQuestions[this.currentQuestionIndex];
        const now = new Date();
        let correct = false;

        if (q.type === 'day') correct = option === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
        if (q.type === 'month') correct = option === ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
        if (q.type === 'season') {
            const m = now.getMonth();
            const season = (m >= 2 && m <= 4) ? 'Spring' : (m >= 5 && m <= 7) ? 'Summer' : (m >= 8 && m <= 10) ? 'Autumn' : 'Winter';
            correct = option === season;
        }

        if (correct) this.gameScore += 33;
        
        if (this.currentQuestionIndex < 2) {
            this.currentQuestionIndex++;
        } else {
            if (this.gameScore > 90) this.gameScore = 100;
            this.finishGame(this.gameScore);
        }
    }

    // --- Word Recall Logic ---
    initWordRecallGame() {
        this.recallPhase = 'memorize';
        this.recallTimeLeft = 10;
        this.selectedRecallWords = [];
        
        const allWords = ['Apple', 'River', 'Table', 'Cloud', 'Smile', 'Book', 'Street', 'Lamp', 'Music', 'Bread', 'Window', 'Stone', 'Bird', 'Chair', 'Ocean'];
        this.recallWords = this.shuffle([...allWords]).slice(0, 5);
        this.recallOptions = this.shuffle([...this.recallWords, ...this.shuffle(allWords.filter(w => !this.recallWords.includes(w))).slice(0, 5)]);

        if (this.recallTimer) clearInterval(this.recallTimer);

        this.recallTimer = setInterval(() => {
            this.recallTimeLeft--;
            this.cdr.detectChanges(); // Update the view for the timer
            if (this.recallTimeLeft <= 0) {
                clearInterval(this.recallTimer);
                this.recallPhase = 'recall';
                this.cdr.detectChanges();
            }
        }, 1000);
    }

    toggleRecallWord(word: string) {
        const index = this.selectedRecallWords.indexOf(word);
        if (index > -1) {
            this.selectedRecallWords.splice(index, 1);
        } else {
            if (this.selectedRecallWords.length < 5) {
                this.selectedRecallWords.push(word);
            }
        }
        this.cdr.detectChanges();
    }

    submitWordRecall() {
        let correct = 0;
        this.selectedRecallWords.forEach(w => {
            if (this.recallWords.includes(w)) correct++;
        });
        this.finishGame((correct / 5) * 100);
    }

    // --- Common Logic ---
    finishGame(score: number) {
        this.gameScore = Math.round(score);
        this.gameState = 'result';
        
        if (this.gameScore >= 80) {
             this.resultMessage = "Fantastic! Your memory is sharp. Keep it up! 🌟";
        } else if (this.gameScore >= 50) {
             this.resultMessage = "Nice effort! Want to try one more time? 👏";
        } else {
             this.resultMessage = "That’s okay, sometimes it’s hard to remember. Let’s try again later 😊";
        }
        
        const timeSpent = Math.round((Date.now() - this.gameStartTime) / 1000);

        const userId = this.authService.currentUser?.userId;
        if (userId) {
            this.wellbeingService.saveGameResult({
                patientId: userId.toString(),
                gameType: this.activeGameId,
                score: this.gameScore,
                timeSpentSeconds: timeSpent
            }).subscribe(() => this.loadLastScores());
        }
    }

    closeGame() {
        this.activeGameId = null;
        this.gameState = 'intro';
    }

    private shuffle(array: any[]) {
        return array.sort(() => Math.random() - 0.5);
    }
}
