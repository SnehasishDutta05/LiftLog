import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Onboarding } from './pages/onboarding/onboarding';
import { Dashboard } from './pages/dashboard/dashboard';
import { ActiveWorkout } from './pages/active-workout/active-workout';
import { ExercisePicker } from './pages/exercise-picker/exercise-picker';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'onboarding',
    component: Onboarding,
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'active-workout',
    component: ActiveWorkout,
  },
  {
    path: 'exercise-picker',
    component: ExercisePicker,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];