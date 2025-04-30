// 导出 BehaviorTracker 类
export class BehaviorTracker {
  constructor() {
    this.userId = null;
    this.visitStartTime = Date.now();
    this.currentPage = window.location.pathname;
    
    console.log('BehaviorTracker 初始化开始');
    
    // 立即尝试获取用户ID
    this.userId = this.getUserId();
    console.log('当前用户ID:', this.userId);
    console.log('当前页面:', this.currentPage);
    
    // 如果用户已登录，立即记录页面访问
    if (this.userId) {
      this.trackPageView();
    }
    
    // 设置点击跟踪
    this.setupClickTracking();
    
    // 设置页面卸载处理器
    window.addEventListener('beforeunload', () => {
      if (this.userId) {
        const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
        this.trackPageView(duration, true);
      }
    });
    
    // 定期检查登录状态
    this.checkInterval = setInterval(() => {
      const newUserId = this.getUserId();
      if (newUserId !== this.userId) {
        console.log('检测到用户状态变化，重新初始化行为跟踪');
        this.userId = newUserId;
        if (this.userId) {
          this.trackPageView();
        }
      }
    }, 1000);
    
    // 添加全局方法，允许其他模块手动触发重新初始化
    window.reinitializeBehaviorTracker = () => {
      console.log('手动触发行为跟踪重新初始化');
      const newUserId = this.getUserId();
      if (newUserId !== this.userId) {
        this.userId = newUserId;
        if (this.userId) {
          this.trackPageView();
        }
      }
    };
    
    console.log('BehaviorTracker 初始化完成');
  }

  getUserId() {
    try {
      const userData = localStorage.getItem('user_data');
      console.log('从localStorage获取的用户数据:', userData);
      
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user.id) {
          console.log('成功获取用户ID:', user.id);
          return user.id;
        }
      }
      console.warn('未找到用户ID，请先登录');
      return null;
    } catch (error) {
      console.error('解析用户数据失败:', error);
      return null;
    }
  }

  async trackPageView(duration = null, isUnload = false) {
    if (!this.userId) {
      console.log('未登录用户，跳过页面访问记录');
      return;
    }

    const pageUrl = window.location.pathname;
    const visitDuration = duration || Math.floor((Date.now() - this.visitStartTime) / 1000);
    const isBounce = visitDuration < 5; // 如果停留时间少于5秒，认为是跳出

    console.log('记录页面访问:', {
      userId: this.userId,
      pageUrl: pageUrl,
      duration: visitDuration,
      isBounce: isBounce
    });

    try {
      const response = await fetch('/api/behavior/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          pageUrl: pageUrl,
          duration: visitDuration,
          isBounce: isBounce
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('页面访问记录成功:', result);
    } catch (error) {
      console.error('记录页面访问失败:', error);
    }
  }

  setupClickTracking() {
    // 移除旧的点击事件监听器
    document.removeEventListener('click', this.handleClick);
    
    // 添加新的点击事件监听器
    this.handleClick = (event) => {
      if (!this.userId) return;

      const buttonType = this.getButtonType(event.target);
      if (buttonType) {
        this.trackClick(buttonType);
      }
    };
    
    document.addEventListener('click', this.handleClick);
  }

  getButtonType(element) {
    // 检查元素本身
    if (element.classList) {
      if (element.classList.contains('add-to-cart')) return 'add_to_cart';
      if (element.classList.contains('checkout')) return 'checkout';
      if (element.classList.contains('product-detail')) return 'product_detail';
      if (element.classList.contains('category-filter')) return 'category_filter';
    }

    // 检查按钮文本
    if (element.tagName === 'BUTTON') {
      const text = element.textContent.toLowerCase();
      if (text.includes('加入购物车')) return 'add_to_cart';
      if (text.includes('结算')) return 'checkout';
      if (text.includes('查看详情')) return 'product_detail';
    }

    // 检查父元素
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.classList) {
        if (parent.classList.contains('add-to-cart')) return 'add_to_cart';
        if (parent.classList.contains('checkout')) return 'checkout';
        if (parent.classList.contains('product-detail')) return 'product_detail';
        if (parent.classList.contains('category-filter')) return 'category_filter';
      }
      parent = parent.parentElement;
    }

    return null;
  }

  async trackClick(buttonType) {
    console.log('记录点击事件:', {
      userId: this.userId,
      pageUrl: window.location.pathname,
      buttonType: buttonType
    });

    try {
      const response = await fetch('/api/behavior/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          pageUrl: window.location.pathname,
          buttonType: buttonType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('点击记录成功:', result);
    } catch (error) {
      console.error('记录点击事件失败:', error);
    }
  }
}

// 移除自动初始化，改为由 session.js 控制初始化时机
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('DOM加载完成，初始化点击跟踪');
//   window.behaviorTracker = new BehaviorTracker();
// }); 