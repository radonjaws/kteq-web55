import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/listen',
      name: 'listen',
      component: () => import('@/pages/ListenPage.vue')
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/pages/SchedulePage.vue')
    },
    {
      path: '/shows',
      name: 'shows',
      component: () => import('@/pages/ShowsPage.vue')
    },
    {
      path: '/shows/:slug',
      name: 'show-detail',
      component: () => import('@/pages/ShowDetailPage.vue')
    },
    {
      path: '/djs',
      name: 'djs',
      component: () => import('@/pages/DjsPage.vue')
    },
    {
      path: '/djs/:slug',
      name: 'dj-detail',
      component: () => import('@/pages/DjDetailPage.vue')
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue')
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/pages/BlogPage.vue')
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/pages/BlogPostPage.vue')
    },
    {
      path: '/donate',
      name: 'donate',
      component: () => import('@/pages/DonatePage.vue')
    },

    // Admin routes
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/pages/admin/AdminDashboard.vue'),
      beforeEnter: (_to, _from, next) => {
        const token = localStorage.getItem('kteq-admin-token')
        if (!token) next({ name: 'admin-login' })
        else next()
      }
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/pages/admin/AdminLogin.vue')
    },
    {
      path: '/admin/schedule',
      name: 'admin-schedule',
      component: () => import('@/pages/admin/AdminSchedule.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/shows',
      name: 'admin-shows',
      component: () => import('@/pages/admin/AdminShows.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/djs',
      name: 'admin-djs',
      component: () => import('@/pages/admin/AdminDjs.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/timeline',
      name: 'admin-timeline',
      component: () => import('@/pages/admin/AdminTimeline.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/posts',
      name: 'admin-posts',
      component: () => import('@/pages/admin/AdminPosts.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/posts/:id',
      name: 'admin-post-edit',
      component: () => import('@/pages/admin/AdminPostEdit.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('@/pages/admin/AdminSettings.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/menu',
      name: 'admin-menu',
      component: () => import('@/pages/admin/AdminMenu.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/campaigns',
      name: 'admin-campaigns',
      component: () => import('@/pages/admin/AdminCampaigns.vue'),
      meta: { requiresAdmin: true }
    },

    // Catch-all
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Global admin guard
router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAdmin) {
    const token = localStorage.getItem('kteq-admin-token')
    if (!token) return next({ name: 'admin-login' })
  }
  next()
})

export default router
