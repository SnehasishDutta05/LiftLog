import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

interface Question {
  key: string;
  text: string;
  placeholder?: string;
  type: 'text' | 'number' | 'choice';
  options?: string[];
}

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding implements OnDestroy {
  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: "Hey! I'm PulseOS 👋",
    },
    {
      sender: 'bot',
      text: "Before we start, I'd like to get to know you a little better.",
    },
    {
      sender: 'bot',
      text: "This will help me build a fitness journey that's right for you.",
    },
    {
      sender: 'bot',
      text: "Let's start with your age. How old are you?",
    },
  ];

  questions: Question[] = [
    {
      key: 'age',
      text: 'How old are you?',
      placeholder: 'Enter your age',
      type: 'number',
    },
    {
      key: 'gender',
      text: 'How do you identify?',
      type: 'choice',
      options: ['Male', 'Female', 'Prefer not to say'],
    },
    {
      key: 'height',
      text: "What's your height?",
      placeholder: 'Enter your height in cm',
      type: 'number',
    },
    {
      key: 'weight',
      text: "What's your current weight?",
      placeholder: 'Enter your weight in kg',
      type: 'number',
    },
    {
      key: 'fitnessLevel',
      text: 'How would you describe your current fitness level?',
      type: 'choice',
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      key: 'goal',
      text: "What's your main fitness goal?",
      type: 'choice',
      options: [
        'Build strength',
        'Lose weight',
        'Improve endurance',
        'Build muscle',
        'Stay healthy',
      ],
    },
  ];

  currentQuestionIndex = 0;

  currentInput = '';

  answers: { [key: string]: string } = {};

  completed = false;

  private completionTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router) {}

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    return (this.currentQuestionIndex / this.questions.length) * 100;
  }

  /*
   * Prevent non-numeric characters
   * for Age, Height and Weight.
   */
  blockNonNumeric(event: KeyboardEvent): void {
    if (this.currentQuestion.type !== 'number') {
      return;
    }

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Enter',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    /*
     * Only allow digits 0-9.
     */
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /*
   * Also clean pasted input.
   *
   * Example:
   * "e165" becomes "165"
   * "60kg" becomes "60"
   */
  sanitizeInput(): void {
    if (this.currentQuestion.type !== 'number') {
      return;
    }

    this.currentInput = this.currentInput.replace(/[^0-9]/g, '');
  }

  submitAnswer(answer?: string): void {
    let value = answer ?? this.currentInput.trim();

    /*
     * Final safety check.
     */
    if (this.currentQuestion.type === 'number') {
      value = value.replace(/[^0-9]/g, '');
    }

    if (!value) {
      return;
    }

    const question = this.currentQuestion;

    /*
     * Add user's answer to chat.
     */
    this.messages.push({
      sender: 'user',
      text: value,
    });

    /*
     * Save answer.
     */
    this.answers[question.key] = value;

    /*
     * Clear input.
     */
    this.currentInput = '';

    /*
     * Move to next question.
     */
    this.currentQuestionIndex++;

    /*
     * Onboarding complete.
     */
    if (this.currentQuestionIndex >= this.questions.length) {
      this.completed = true;

      this.messages.push({
        sender: 'bot',
        text: 'Amazing! I have everything I need. 💚',
      });

      this.messages.push({
        sender: 'bot',
        text: "I'm ready to create your personalized fitness journey.",
      });

      /*
       * Automatically go to dashboard
       * after 2.5 seconds.
       */
      this.completionTimer = setTimeout(() => {
        this.finishOnboarding();
      }, 2500);

      return;
    }

    /*
     * Ask next question.
     */
    this.messages.push({
      sender: 'bot',
      text: this.currentQuestion.text,
    });
  }

  finishOnboarding(): void {
    console.log('Onboarding answers:', this.answers);

    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  ngOnDestroy(): void {
    if (this.completionTimer) {
      clearTimeout(this.completionTimer);
    }
  }
}
