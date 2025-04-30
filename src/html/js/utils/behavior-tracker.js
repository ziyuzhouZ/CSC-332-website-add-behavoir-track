class BehaviorTracker {
  constructor() {
    console.log('BehaviorTracker 初始化开始');
    this.visitStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.userId = this.getUserId();
    console.log('当前用户ID:', this.userId);
    console.log('当前页面:', this.currentPage);
    this.setupPageUnloadHandler();
    this.recordInitialVisit();
    console.log('BehaviorTracker 初始化完成');
  }

  // 获取用户ID（从localStorage中）
  getUserId() {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('从localStorage获取的用户数据:', userData);
      return userData ? userData.id : null;
    } catch (error) {
      console.error('获取用户ID错误:', error);
      return null;
    }
  }

  // 设置页面卸载处理器
  setupPageUnloadHandler() {
    console.log('设置页面卸载处理器');
    window.addEventListener('beforeunload', () => {
      console.log('页面即将卸载，记录访问数据');
      this.recordPageVisit(true);
    });
  }

  // 记录初始访问
  recordInitialVisit() {
    console.log('尝试记录初始访问');
    if (this.userId) {
      console.log('用户已登录，记录访问');
      this.recordPageVisit(false);
    } else {
      console.log('用户未登录，跳过记录');
    }
  }

  // 记录页面访问
  recordPageVisit(isUnload = false) {
    console.log('开始记录页面访问');
    const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
    const isBounce = this.isBounce();

    const data = {
      userId: this.userId,
      pageUrl: this.currentPage,
      duration: duration,
      isBounce: isBounce
    };

    console.log('准备发送的访问数据:', data);

    if (isUnload) {
      console.log('使用sendBeacon发送数据');
      const success = navigator.sendBeacon('/api/behavior/visit', JSON.stringify(data));
      console.log('sendBeacon发送结果:', success);
    } else {
      console.log('使用fetch发送数据');
      fetch('/api/behavior/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log('访问数据记录响应状态:', response.status);
        return response.json();
      })
      .then(data => console.log('访问数据记录结果:', data))
      .catch(error => console.error('记录访问数据失败:', error));
    }
  }

  // 判断是否为跳出访问
  isBounce() {
    return document.documentElement.scrollHeight <= window.innerHeight;
  }

  // 记录点击事件
  trackClick(buttonType) {
    if (!this.userId) return;

    fetch('/api/behavior/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        pageUrl: this.currentPage,
        buttonType: buttonType
      })
    }).catch(error => console.error('记录点击数据失败:', error));
  }

  // 初始化页面点击跟踪
  setupClickTracking() {
    // 跟踪导航链接点击
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        this.trackClick('nav_link');
      });
    });

    // 跟踪产品相关按钮
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', () => {
        this.trackClick('add_to_cart');
      });
    });

    // 跟踪搜索按钮
    document.querySelectorAll('.search-button').forEach(button => {
      button.addEventListener('click', () => {
        this.trackClick('search');
      });
    });

    // 跟踪筛选按钮
    document.querySelectorAll('.filter-button').forEach(button => {
      button.addEventListener('click', () => {
        this.trackClick('filter');
      });
    });

    // 跟踪收藏按钮
    document.querySelectorAll('.favorite-button').forEach(button => {
      button.addEventListener('click', () => {
        this.trackClick('favorite');
      });
    });

    // 跟踪分享按钮
    document.querySelectorAll('.share-button').forEach(button => {
      button.addEventListener('click', () => {
        this.trackClick('share');
      });
    });
  }
}

// 创建全局实例
console.log('准备创建BehaviorTracker实例');
window.behaviorTracker = new BehaviorTracker();

// 页面加载完成后初始化点击跟踪
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，初始化点击跟踪');
  window.behaviorTracker.setupClickTracking();
}); 