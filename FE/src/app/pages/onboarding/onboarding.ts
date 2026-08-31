import {
  Component,
  OnDestroy,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  finalize,
} from 'rxjs';

import {
  environment,
} from '../../../environments/environment';


interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}


interface Question {
  key: string;
  text: string;
  placeholder?: string;
  type: 'text' | 'number' | 'choice' | 'dob';
  options?: string[];
}


interface ProfileRequest {
  dob: string;
  height: number;
  weight: number;
  sex: string;

  wake_time: string;
  sleep_time: string;
  work_schedule: string;
  daily_activity: string;
  commute: string;
  available_training_time: string;

  experience: string;

  training_days: number;
  preferred_time: string;
  preferred_exercises: string;
  disliked_exercises: string;
  limitations: string;

  typical_foods: string;
  meals_per_day: number;
  eating_out_frequency: string;
  favorite_foods: string;
  favorite_snacks: string;
  dietary_preferences: string;
  cooking_constraints: string;

  primary_goal: string;
}


interface ProfileResponse {
  message: string;
}


@Component({
  selector: 'app-onboarding',
  imports: [
    FormsModule,
  ],
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
      text:
        "Before we start, I'd like to get to know you a little better.",
    },
    {
      sender: 'bot',
      text:
        "This will help me build a fitness journey that's right for you.",
    },
    {
      sender: 'bot',
      text:
        "Let's start with your date of birth.",
    },
  ];


  questions: Question[] = [
    {
      key: 'dob',
      text: "What's your date of birth?",
      placeholder: 'DD/MM/YYYY',
      type: 'dob',
    },
    {
      key: 'gender',
      text: 'How do you identify?',
      type: 'choice',
      options: [
        'Male',
        'Female',
        'Prefer not to say',
      ],
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
      text:
        'How would you describe your current fitness level?',
      type: 'choice',
      options: [
        'Beginner',
        'Intermediate',
        'Advanced',
      ],
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

  answers: {
    [key: string]: string;
  } = {};

  completed = false;

  isSavingProfile = false;

  profileError = '';

  dobError = '';


  private readonly profileUrl =
    `${environment.apiBaseUrl}/profile`;


  private completionTimer?:
    ReturnType<typeof setTimeout>;


  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}


  get currentQuestion(): Question {
    return this.questions[
      this.currentQuestionIndex
    ];
  }


  get progress(): number {
    return (
      this.currentQuestionIndex /
      this.questions.length
    ) * 100;
  }


  blockNonNumeric(
    event: KeyboardEvent,
  ): void {

    if (
      this.currentQuestion.type !== 'number' &&
      this.currentQuestion.type !== 'dob'
    ) {
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


    if (
      allowedKeys.includes(event.key)
    ) {
      return;
    }


    if (
      !/^[0-9]$/.test(event.key)
    ) {
      event.preventDefault();
    }

  }


  sanitizeInput(): void {

    if (
      this.currentQuestion.type === 'number'
    ) {

      this.currentInput =
        this.currentInput.replace(
          /[^0-9]/g,
          '',
        );

      return;

    }


    if (
      this.currentQuestion.type === 'dob'
    ) {

      this.formatDobInput();

    }

  }


  private formatDobInput(): void {

    this.dobError = '';


    let digits =
      this.currentInput.replace(
        /[^0-9]/g,
        '',
      );


    digits =
      digits.substring(
        0,
        8,
      );


    if (
      digits.length <= 2
    ) {

      this.currentInput =
        digits;

      return;

    }


    if (
      digits.length <= 4
    ) {

      this.currentInput =
        `${digits.substring(0, 2)}/${digits.substring(2)}`;

      return;

    }


    this.currentInput =
      `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4)}`;

  }


  submitAnswer(
    answer?: string,
  ): void {

    if (
      this.completed ||
      this.isSavingProfile
    ) {
      return;
    }


    let value =
      answer ??
      this.currentInput.trim();


    if (
      this.currentQuestion.type === 'number'
    ) {

      value =
        value.replace(
          /[^0-9]/g,
          '',
        );

    }


    if (
      this.currentQuestion.type === 'dob'
    ) {

      if (
        !this.isValidDob(value)
      ) {

        this.dobError =
          'Please enter a valid date of birth in DD/MM/YYYY format.';

        return;

      }

      this.dobError = '';

    }


    if (!value) {
      return;
    }


    const question =
      this.currentQuestion;


    this.messages.push({
      sender: 'user',
      text: value,
    });


    this.answers[
      question.key
    ] = value;


    this.currentInput = '';


    this.currentQuestionIndex++;


    if (
      this.currentQuestionIndex >=
      this.questions.length
    ) {

      this.saveOnboardingProfile();

      return;

    }


    this.messages.push({
      sender: 'bot',
      text:
        this.currentQuestion.text,
    });

  }


  private isValidDob(
    value: string,
  ): boolean {

    const match =
      value.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
      );


    if (!match) {
      return false;
    }


    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);


    const date =
      new Date(
        year,
        month - 1,
        day,
      );


    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }


    const today =
      new Date();


    if (
      date > today
    ) {
      return false;
    }


    const earliestYear =
      today.getFullYear() - 120;


    if (
      year < earliestYear
    ) {
      return false;
    }


    return true;

  }


  private convertDobForBackend(
    dob: string,
  ): string {

    const [
      day,
      month,
      year,
    ] =
      dob.split('/');


    return `${year}-${month}-${day}`;

  }


  private saveOnboardingProfile(): void {

    this.isSavingProfile = true;

    this.profileError = '';


    const profile:
      ProfileRequest = {

      dob:
        this.convertDobForBackend(
          this.answers['dob'] ?? '',
        ),

      height:
        Number(
          this.answers['height'],
        ),

      weight:
        Number(
          this.answers['weight'],
        ),

      sex:
        this.answers['gender'] ?? '',

      wake_time: '',

      sleep_time: '',

      work_schedule: '',

      daily_activity: '',

      commute: '',

      available_training_time: '',

      experience:
        this.answers[
          'fitnessLevel'
        ] ?? '',

      training_days: 0,

      preferred_time: '',

      preferred_exercises: '',

      disliked_exercises: '',

      limitations: '',

      typical_foods: '',

      meals_per_day: 0,

      eating_out_frequency: '',

      favorite_foods: '',

      favorite_snacks: '',

      dietary_preferences: '',

      cooking_constraints: '',

      primary_goal:
        this.answers['goal'] ?? '',

    };


    console.log(
      'Profile request:',
      profile,
    );


    this.http
      .post<ProfileResponse>(
        this.profileUrl,
        profile,
      )
      .pipe(

        finalize(() => {

          this.isSavingProfile =
            false;

        }),

      )
      .subscribe({

        next: (
          response,
        ) => {

          console.log(
            'Profile saved:',
            response,
          );


          this.completeOnboarding();

        },


        error: (
          error:
            HttpErrorResponse,
        ) => {

          console.error(
            'Profile save failed:',
            error,
          );


          if (
            error.status === 401
          ) {

            this.profileError =
              'Your session has expired. Please sign in again.';

            return;

          }


          if (
            error.status === 422
          ) {

            this.profileError =
              'Some profile information was not accepted. Please check your answers.';

            return;

          }


          if (
            error.status === 0
          ) {

            this.profileError =
              'Unable to connect to PulseOS. Please make sure the server is running.';

            return;

          }


          this.profileError =
            'Unable to save your profile. Please try again.';

        },

      });

  }


  private completeOnboarding(): void {

    this.completed = true;


    this.messages.push({
      sender: 'bot',
      text:
        'Everything is set! 💚',
    });


    this.messages.push({
      sender: 'bot',
      text:
        'Welcome aboard. Your PulseOS journey starts now.',
    });


    this.completionTimer =
      setTimeout(() => {

        this.finishOnboarding();

      }, 3000);

  }


  finishOnboarding(): void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  goBack(): void {

    if (
      this.currentQuestionIndex > 0 &&
      !this.isSavingProfile &&
      !this.completed
    ) {

      this.currentQuestionIndex--;

    }

  }


  ngOnDestroy(): void {

    if (
      this.completionTimer
    ) {

      clearTimeout(
        this.completionTimer,
      );

    }

  }

}