// src/store/modules/auth.js

import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { ROUTE_NAMES } from '@/constants/routes'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 用户数据
    user: null,
    // 认证令牌
    token: null,
    // 加载状态
    loading: false,
    // 错误状态
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    
    // 改进的isAdmin getter，确保角色检查正确
    isAdmin: (state) => {
      return state.user && (state.user.role === 1 || state.user.role === 2);
    },
    
    // 添加isSuperAdmin getter，用于某些特殊权限检查
    isSuperAdmin: (state) => {
      return state.user && state.user.role === 2;
    }
  },
  
  actions: {
    /**
     * 注册新用户
     */
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authApi.register(userData);
        return response.data;
      } catch (error) {
        this.error = error.message;
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 用户登录
     */
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authApi.login(credentials);
        
        const { token } = response.data;
        
        // 在状态中存储令牌
        this.token = token;
        
        // 获取用户信息
        await this.fetchCurrentUser();
        
        return true;
      } catch (error) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取当前用户信息
     */
    async fetchCurrentUser() {
      if (!this.token) return null;
      
      try {
        const response = await authApi.getCurrentUser();
        this.user = response.data;
        return this.user;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        this.user = null;
        return null;
      }
    },
    
    /**
     * 用户登出
     */
    logout(router) {
      // 清除令牌和用户数据
      this.token = null;
      this.user = null;
      
      // 重定向到登录页面
      router.push({ name: ROUTE_NAMES.LOGIN });
    },
    
    /**
     * 检查用户名是否存在
     */
    async checkUsername(username) {
      try {
        const response = await authApi.checkUsername(username);
        return response.data;
      } catch (error) {
        return false;
      }
    },
    
    /**
     * 检查邮箱是否存在
     */
    async checkEmail(email) {
      try {
        const response = await authApi.checkEmail(email);
        return response.data;
      } catch (error) {
        return false;
      }
    }
  },
  
  persist: {
    key: 'croj-auth',
    storage: localStorage,
    paths: ['token']
  }
})