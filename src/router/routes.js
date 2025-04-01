import { ROUTE_NAMES } from '@/constants/routes'

// Layout components
const MainLayout = () => import('@/views/layout/MainLayout.vue')
const AuthLayout = () => import('@/views/layout/AuthLayout.vue')

// Auth pages
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')

// Dashboard and other pages
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const NotFound = () => import('@/views/error/NotFound.vue')

// Routes configuration
const routes = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: ROUTE_NAMES.DASHBOARD,
        component: Dashboard,
        meta: {
          title: 'Dashboard',
          icon: 'el-icon-menu'
        }
      }
    ]
  },
  {
    path: '/auth',
    component: AuthLayout,
    meta: { guest: true },
    children: [
      {
        path: 'login',
        name: ROUTE_NAMES.LOGIN,
        component: Login,
        meta: {
          title: 'Login'
        }
      },
      {
        path: 'register',
        name: ROUTE_NAMES.REGISTER,
        component: Register,
        meta: {
          title: 'Register'
        }
      }
    ]
  },
  // Redirect /login and /register to /auth/login and /auth/register
  {
    path: '/login',
    redirect: { name: ROUTE_NAMES.LOGIN }
  },
  {
    path: '/register',
    redirect: { name: ROUTE_NAMES.REGISTER }
  },
  // Catch all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: NotFound
  },
  // verify email
  {
    path: '/verify-email',
    name: ROUTE_NAMES.VERIFY_EMAIL,
    component: () => import('@/views/auth/VerifyEmail.vue'),
    meta: {
      title: 'Verify Email'
    }
  }
]

export default routes