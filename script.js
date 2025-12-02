
let indev = false;
// 全局变量
let uiArkringHeight = 0;
let uiCurrentPhase = -1;
let uiCurrentScrollY = 0;
let uiCurrentScrollPercent = 0;
// 存储height-zero元素的位置信息
let heightZeroPosition = null;
let heightZeroElement = null;

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/*
    * UI
    */

function showBottomNavBar(id) {
    let navBars = document.querySelectorAll("ul[id^='desktop-navbar-']");
    let bottomNavBar = document.getElementById(id);
    
    // 检查当前导航栏是否已打开
    let isOpen = bottomNavBar.classList.contains("open");
    
    // 隐藏所有导航栏
    navBars.forEach(navBar => {
        navBar.classList.remove("open");
    });
    
    // 如果当前导航栏未打开，则打开它；如果已打开，则保持关闭状态（实现切换效果）
    if (!isOpen) {
        bottomNavBar.classList.add("open");
    }

    //点击页面其它区域关闭导航栏
    document.addEventListener("click", function(event) {
        if (!event.target.closest("#desktop-navbar")) {
            navBars.forEach(navBar => {
                navBar.classList.remove("open");
            });
        }
    });

}

function toggleSidebar() {
    let sideBar = document.getElementById("side-bar");
    sideBar.classList.toggle("open");

    let closeSideBar = document.getElementById("close-side-bar");
    closeSideBar.classList.toggle("open");

    // 关闭底部导航栏
    let bottomNavBar = document.getElementById("desktop-navbar-right").querySelector("ul>li>ul");
    bottomNavBar.classList.remove("open");
}

function showMobileNavbar(id) {
    // 移除所有导航项的选中状态
    let mobileNavbar = document.getElementById("mobile-navbar");
    let mobileNavbarItems = mobileNavbar.querySelectorAll("li[id^='mobile-navbar-item-']");
    mobileNavbarItems.forEach(item => {
        item.classList.remove("selected");
    });
    document.getElementById(id).classList.add("selected");

    //从id获取for="id"的div#mobile-navbar-list下的li
    let mobileNavContainer = document.getElementById("mobile-navbar-list");
    let ContainerItems = mobileNavContainer.querySelectorAll("li[for^='mobile-navbar-item-']");
    let selectedItem = mobileNavContainer.querySelector(`li[for="${id}"]`);
    // 移除所有导航项的选中状态
    mobileNavbarItems.forEach(item => {
        ContainerItems.forEach(item => {
            item.classList.remove("selected");
        });
    });
    selectedItem.classList.toggle("selected");

    //点击其它地方关闭导航栏
    document.addEventListener("click", function(event) {
        if (!event.target.closest("#mobile-navbar")) {
            mobileNavbarItems.forEach(item => {
                item.classList.remove("selected");
            });
            mobileNavContainer.classList.add("fadeout");
            ContainerItems.forEach(item => {
                setTimeout(() => {
                    item.classList.remove("selected");
                    mobileNavContainer.classList.remove("fadeout");
                }, 150);
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {

    // 接受iframe URL传参
    let urlParams = new URLSearchParams(window.location.search);

    // 底栏链接同步
    let pagename = urlParams.get("pagename");
    if (pagename) {
        document.getElementById("wikidot-edit-button").setAttribute("href", `https://scp-wiki-cn.wikidot.com/${pagename}/edit/true/norender/true`);
    }
    let pageforum = urlParams.get("forumid");
    if (pageforum) {
        document.getElementById("wikidot-forum-button").setAttribute("href", `https://scp-wiki-cn.wikidot.com/forum/${pageforum}`);
    }

    // 初始化顶部导航栏的动画延迟
    let navLists = document.querySelectorAll("div#mobile-navbar-list>ul>li>ul");
    navLists.forEach((list, index) => {
        let listItems = list.querySelectorAll("li>a");
        listItems.forEach((item, index) => {
            item.style.opacity = Math.random(0, 0.2);
            item.style.animationDelay = `${index * 0.02 + Math.random() * 0.25}s`;
        });
    });

    //生成模态框ID
    let modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        generateModalID(modal);
    });

    if(window.innerWidth >= 800) {
        overlayNumber('hide-instant');
    }

    // 调试模式
    if (urlParams.get("debug") === "true" || indev) {
        debug = true;
    } else {
        debug = false;
    }

    // 初始化height-zero元素的位置信息
    updateHeightZeroPosition();
    
    // 初始化图片优先加载系统
    initImageLoading();
    
    // 监听窗口大小变化，更新height-zero元素的位置
    window.addEventListener('resize', debounce(function() {
        updateHeightZeroPosition();
    }, 100));

    if (!debug) {
        // 实装时的设置
        document.getElementById("content-container").style.animation = "fade-in 2s ease-in-out";
        document.documentElement.style.backgroundColor = "transparent";
        document.getElementById("desktop-navbar").style.animation = "nav-fade-in 1.5s ease-in-out 0.25s forwards";
        if (window.innerWidth > 1000) {
            document.getElementById("extra-div-1").style.animation = "nav-fade-in-2 1.2s ease-in-out 0.5s forwards";
        }
        if (window.innerWidth <= 7000) {
            document.getElementById("mobile-navbar").style.animation = "topnav-fade-in 1s ease-in-out 0.25s forwards";
        }
        // 防止侧边栏变透明时显示Wikidot原生页面
        setTimeout(() => {
            document.documentElement.style.backgroundColor = "var(--color-dark-layer-1)";
        }, 2000);
    }

    if (debug) {

    }

});

/*
    * 滚动更新页面元素
    */


// 更新height-zero元素的位置信息
function updateHeightZeroPosition() {
    heightZeroElement = document.getElementById("height-zero");
    if (heightZeroElement) {
        heightZeroPosition = heightZeroElement.offsetTop;
    } else {
        heightZeroPosition = null;
    }
}

function updateOverlay() {
    let heightNumber = document.getElementById("height-number");
    
    if (heightZeroPosition !== null) {
        // 计算当前滚动位置到height-zero的差值
        const scrollDiff = Math.max(0, heightZeroPosition - window.scrollY);
        
        // 计算滚动差值占总滚动范围的百分比
        const scrollRatio = Math.min(1, scrollDiff / heightZeroPosition);
        
        // 根据滚动比例计算显示的高度值
        uiArkringHeight = parseInt(2300000 * scrollRatio);
    } else {
        // 如果找不到height-zero元素，回退到原始计算方式
        uiArkringHeight = parseInt(2300000 * (1 - window.scrollData.scrollPercent / 100));
    }
    
    // 将高度整数转换为三位一逗号的字符串
    heightNumber.textContent = uiArkringHeight.toLocaleString();
}

function showTitleSection(sectionId) {
    console.log(sectionId);
    let section = document.getElementById(sectionId);
    section.classList.add("section-fade-in");
}

function overlayNumber(type, shouldMobile = false, onlyMobile = false) {
    console.log('Animation:' + type);
    let overlayNumber = document.getElementById("overlay-number");
    if (!shouldMobile && window.innerWidth <= 800) {
        return;
    }
    if (onlyMobile && window.innerWidth > 800) {
        return;
    }
    overlayNumber.removeAttribute("style");

    switch (type) { // 别骂我区，我真没时间给你写优雅的实现方式了
        case "pos1":
            overlayNumber.style.animation = "overlay-number-pos1 1.5s ease forwards";
            break;
        case "pos1-reverse":
            overlayNumber.style.animation = "overlay-number-pos1-reverse 1.5s ease forwards";
            break;
        case "hide-instant":
            overlayNumber.style.animation = "overlay-number-fade-out 0s forwards";
            break;
        case "show-instant":
            overlayNumber.style.animation = "overlay-number-fade-in 0s forwards";
            break;
        case "fade-in":
            overlayNumber.style.animation = "overlay-number-fade-in 1.5s ease forwards";
            break;
        case "fade-out":
            overlayNumber.style.animation = "overlay-number-fade-out 1.5s ease forwards";
            break;
        case "fade-out-2":
            overlayNumber.style.animation = "overlay-number-fade-out-2 1s ease forwards";
            overlayNumber.classList.remove("final-record");
            break;
        case "fade-in-2":
            overlayNumber.style.animation = "overlay-number-fade-in-2 1s ease forwards";
            break;
        case "mobile-out-fr":
            overlayNumber.classList.remove("final-record");
            overlayNumber.style.animation = "overlay-number-fade-in 1.5s ease forwards";
            break;
        case "final-record":
            intoFinalRecord();
            break;
        case "final-record-reverse":
            outOfFinalRecord();
            break;
        case "fade-out-end":
            overlayNumber.classList.add("end-fade-out");
            break;
    }
}

function intoFinalRecord() {
    let overlayNumber = document.getElementById("overlay-number");
    overlayNumber.removeAttribute("style");
    overlayNumber.classList.add("final-record");
    overlayNumber.classList.remove("end");
}

function outOfFinalRecord() {
    let overlayNumber = document.getElementById("overlay-number");
    overlayNumber.removeAttribute("style");
    overlayNumber.classList.add("end");
    overlayNumber.classList.remove("end-fade-out");
}


function textEffectChange1() {
    let nameElements = document.getElementsByClassName("effect-change");
    const changeNameAnim = ["596", "59?", "?6??", "????", "艾?#6?&", "艾#?瑟华??#", "艾瑟琳??#华斯", "艾瑟琳·华兹?斯", "艾瑟琳·华兹华斯"];

    Array.from(nameElements).forEach(el => {
        let index = 0;
        const timer = setInterval(() => {
            el.textContent = changeNameAnim[index];
            index++;
            if (index >= changeNameAnim.length) {
                clearInterval(timer);
                el.classList.remove("effect-change");
            }
        }, 200);
    });
}

function textEddectChange2(text1, text2) {
    let text1Element = document.getElementById("chapter-name-en");
    let text2Element = document.getElementById("chapter-name");
    text1Element.textContent = text1;
    text2Element.textContent = text2;
}



/*
    * 滚动事件系统
    */

// 滚动事件系统 - 使用Intersection Observer API
(function() {
    // 滚动相关变量
    window.scrollData = {
        scrollY: 0,
        scrollX: 0,
        scrollPercent: 0,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        currentSection: null,
        previousSection: null,
        // 滚动速度矢量，单位：像素/毫秒
        scrollVector: {
            x: 0,
            y: 0
        }
    };
    
    // 跟踪上一次滚动位置和时间，用于计算速度
    let lastScrollX = 0;
    let lastScrollY = 0;
    let lastScrollTime = 0;

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 更新滚动相关变量
    function updateScrollVariables() {
        const { scrollY, scrollX, innerHeight } = window;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );
        
        // 计算滚动速度
        const currentTime = performance.now();
        const deltaTime = lastScrollTime > 0 ? (currentTime - lastScrollTime) : 0;
        
        let scrollVectorX = 0;
        let scrollVectorY = 0;
        
        if (deltaTime > 0) {
            // 计算速度 (像素/毫秒)
            scrollVectorX = (scrollX - lastScrollX) / deltaTime;
            scrollVectorY = (scrollY - lastScrollY) / deltaTime;
            
            // 添加平滑因子，减少速度波动
            scrollVectorX = scrollVectorX * 0.7 + window.scrollData.scrollVector.x * 0.3;
            scrollVectorY = scrollVectorY * 0.7 + window.scrollData.scrollVector.y * 0.3;
        }
        
        // 更新最后滚动位置和时间
        lastScrollX = scrollX;
        lastScrollY = scrollY;
        lastScrollTime = currentTime;
        
        window.scrollData = {
            ...window.scrollData,
            scrollY,
            scrollX,
            scrollPercent: Math.min((scrollY / (documentHeight - innerHeight)) * 100, 100),
            viewportHeight: innerHeight,
            viewportWidth: window.innerWidth,
            documentHeight,
            scrollVector: {
                x: scrollVectorX,
                y: scrollVectorY
            }
        };
    }

    // 执行滚动监听器的回调函数
    function executeScrollListeners() {
        const elements = document.querySelectorAll('[data-scroll-listener="true"]');
        elements.forEach(element => {
            const onScroll = element.getAttribute('data-onscroll');
            if (onScroll) {
                try {
                    // 创建一个安全的执行环境
                    const func = new Function('element', `with(element) { ${onScroll} }`);
                    func(element);
                } catch (error) {
                    console.error(`Error executing data-onscroll for element:`, error);
                }
            }
        });
    }

    // 处理可见section的显示回调
    let sectionObserver;
    let visibleSections = [];
    // 跟踪已经处理过显示回调的元素，避免重复触发
    let shownElements = new Set();

    function handleSectionVisibility(entries) {
        entries.forEach(entry => {
            const section = entry.target;
            
            if (entry.isIntersecting) {
                // 计算section在视口中的位置
                const rect = section.getBoundingClientRect();
                const scrollY = window.scrollY;
                const offsetTop = rect.top + scrollY;
                
                // 添加到可见section列表，包含位置信息
                visibleSections.push({
                    section,
                    offsetTop,
                    bottom: offsetTop + rect.height
                });
                
                // 标记为已显示
                shownElements.add(section);
            } else {
                // 从可见列表中移除
                visibleSections = visibleSections.filter(item => item.section !== section);
                
                // 如果元素之前显示过但现在不再可见，执行leave回调
                if (shownElements.has(section)) {
                    // 执行元素的data-onleave回调
                    const onLeave = section.getAttribute('data-onleave');
                    if (onLeave) {
                        try {
                            const func = new Function('section', `with(section) { ${onLeave} }`);
                            func(section);
                            console.log(`onleave执行成功：` + section.id + `${section.getAttribute('data-onleave')}`);
                        } catch (error) {
                            console.error(`Error executing data-onleave for section:`, error);
                        }
                    }
                    // 移除已显示标记，避免重复触发leave回调
                    shownElements.delete(section);
                }
            }
        });

        // 如果有可见的section，找出最下面的那个
        if (visibleSections.length > 0) {
            // 按底部位置排序，取最下面的
            visibleSections.sort((a, b) => b.bottom - a.bottom);
            const newCurrentSection = visibleSections[0].section;
            
            // 只有当当前section改变时才执行回调
            if (newCurrentSection !== window.scrollData.currentSection) {
                window.scrollData.previousSection = window.scrollData.currentSection;
                window.scrollData.currentSection = newCurrentSection;
                
                // 执行当前section的data-onshow回调
                const onShow = newCurrentSection.getAttribute('data-onshow');
                if (onShow) {
                    try {
                        const func = new Function('section', `with(section) { ${onShow} }`);
                        func(newCurrentSection);
                        console.log(`onshow执行成功：` + newCurrentSection.id + `${newCurrentSection.getAttribute('data-onshow')}`);
                    } catch (error) {
                        console.error(`Error executing data-onshow for section:`, error);
                    }
                }
            }
        } else if (window.scrollData.currentSection) {
            // 如果没有可见section，清空当前section
            window.scrollData.previousSection = window.scrollData.currentSection;
            window.scrollData.currentSection = null;
        }
    }

    // 初始化section观察器
    function initSectionObserver() {
        // 根据设备类型调整观察器参数
        const isMobile = window.innerWidth <= 800;
        
        // 为移动设备设置更敏感的参数
        const options = {
            root: null, // 使用视口作为根
            // 移动设备使用更大的margin以提前触发
            rootMargin: isMobile ? '-10% 0px -10% 0px' : '0px',
            // 移动设备使用更低的阈值以更敏感地检测可见性
            threshold: isMobile ? 0.05 : 0.1 // 移动设备5%可见时触发，桌面10%可见时触发
        };

        sectionObserver = new IntersectionObserver(handleSectionVisibility, options);
        
        // 观察所有section元素
        document.querySelectorAll('section').forEach(section => {
            sectionObserver.observe(section);
        });
    }

    // 处理滚动事件的主函数 - 直接触发，不使用debounce
    function handleScroll() {
        // 使用requestAnimationFrame优化性能，但保持持续触发
        requestAnimationFrame(() => {
            updateScrollVariables();
            executeScrollListeners();
            
            // 对于移动设备，可能需要更积极地检查section可见性
            if (window.innerWidth <= 800) {
                // 强制更新可见section检查 - 对于移动设备的优化
                visibleSections = [];
                document.querySelectorAll('section').forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const isVisible = (
                        rect.top <= window.innerHeight * 0.5 &&
                        rect.bottom >= window.innerHeight * 0.5
                    );
                    
                    if (isVisible) {
                        const scrollY = window.scrollY;
                        visibleSections.push({
                            section,
                            offsetTop: rect.top + scrollY,
                            bottom: rect.top + scrollY + rect.height
                        });
                        // 确保初始可见的元素标记为已显示
                        if (!shownElements.has(section)) {
                            shownElements.add(section);
                        }
                    }
                });
                
                // 处理可见section
                if (visibleSections.length > 0) {
                    // 按底部位置排序，取最下面的
                    visibleSections.sort((a, b) => b.bottom - a.bottom);
                    const newCurrentSection = visibleSections[0].section;
                    
                    // 只有当当前section改变时才执行回调
                    if (newCurrentSection !== window.scrollData.currentSection) {
                        window.scrollData.previousSection = window.scrollData.currentSection;
                        window.scrollData.currentSection = newCurrentSection;
                        
                        // 执行当前section的data-onshow回调
                        const onShow = newCurrentSection.getAttribute('data-onshow');
                        if (onShow) {
                            try {
                                const func = new Function('section', `with(section) { ${onShow} }`);
                                func(newCurrentSection);
                            } catch (error) {
                                console.error(`Error executing data-onshow for section:`, error);
                            }
                        }
                    }
                }
            }
        });
    }

    // 初始化函数
    function initScrollSystem() {
        // 初始更新滚动变量
        updateScrollVariables();
        
        // 初始化section观察器
        initSectionObserver();
        
        // 添加滚动事件监听 - 直接绑定，不使用debounce
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 添加resize事件监听，更新视口大小
        window.addEventListener('resize', debounce(() => {
            window.scrollData.viewportHeight = window.innerHeight;
            window.scrollData.viewportWidth = window.innerWidth;
            window.scrollData.documentHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            );
            // 重新计算滚动百分比
            handleScroll();
            
            // 当窗口大小改变时，重新初始化section观察器以适应新的设备类型
            if (sectionObserver) {
                // 停止观察所有元素
                sectionObserver.disconnect();
            }
            // 重新初始化观察器
            initSectionObserver();
            // 强制检查当前可见的section
            setTimeout(() => {
                const forcedEntries = [];
                document.querySelectorAll('section').forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
                    forcedEntries.push({
                        target: section,
                        isIntersecting
                    });
                });
                handleSectionVisibility(forcedEntries);
            }, 100);
        }, 250));
        
        // 页面加载完成后，手动触发一次section检测
        setTimeout(() => {
            // 强制检查当前可见的section
            visibleSections = [];
            document.querySelectorAll('section').forEach(section => {
                const rect = section.getBoundingClientRect();
                const isVisible = (
                    rect.top <= window.innerHeight * 0.5 &&
                    rect.bottom >= window.innerHeight * 0.5
                );
                
                if (isVisible) {
                    const scrollY = window.scrollY;
                    visibleSections.push({
                        section,
                        offsetTop: rect.top + scrollY,
                        bottom: rect.top + scrollY + rect.height
                    });
                    // 初始可见的元素标记为已显示
                    shownElements.add(section);
                }
            });
            
            // 处理初始可见的section
            handleSectionVisibility([]);
        }, 100);
    }

    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollSystem);
    } else {
        initScrollSystem();
    }
})();


/*
    * 图片优先加载系统
    * 先加载低分辨率图片，再加载高分辨率图片
    */

// 处理section背景图片的优先加载
function loadSectionBackgrounds() {
    // 获取所有带有data-bg属性的section元素
    const sections = document.querySelectorAll('section[data-bg]');
    
    sections.forEach(section => {
        const lowResBg = section.getAttribute('data-bg-resize');
        const highResBg = section.getAttribute('data-bg');
        
        // 如果有低分辨率图片，先加载它
        if (lowResBg) {
            section.style.backgroundImage = lowResBg;
            
            // 如果有高分辨率图片，预加载它
            if (highResBg) {
                const img = new Image();
                img.onload = function() {
                    // 高分辨率图片加载完成后，替换背景
                    section.style.backgroundImage = highResBg;
                };
                // 从URL中提取图片地址
                const highResUrl = highResBg.match(/url\(['"]?([^'"\)]+)['"]?\)/)[1];
                img.src = highResUrl;
            }
        } else if (highResBg) {
            // 如果没有低分辨率图片，直接使用高分辨率图片
            section.style.backgroundImage = highResBg;
        }
    });
}

// 处理img标签的优先加载
function loadImageSources() {
    // 获取所有带有data-resize属性的img元素
    const images = document.querySelectorAll('img[data-resize]');
    
    images.forEach(img => {
        const lowResSrc = img.getAttribute('data-resize');
        const originalSrc = img.getAttribute('src');
        
        // 如果有低分辨率图片，先加载它
        if (lowResSrc) {
            // 保存原始src
            img.setAttribute('data-original-src', originalSrc);
            // 设置低分辨率图片
            img.setAttribute('src', lowResSrc);
            
            // 如果有原始图片，预加载它
            if (originalSrc) {
                const preloadImg = new Image();
                preloadImg.onload = function() {
                    // 原始图片加载完成后，替换src
                    img.setAttribute('src', originalSrc);
                };
                preloadImg.src = originalSrc;
            }
        }
    });
}

// 初始化图片优先加载系统
function initImageLoading() {
    loadSectionBackgrounds();
    loadImageSources();
}

/*
    * 其它功能
    */

// 生成模态框ID
function generateModalID(modalElement) {
    const modalIDElement = modalElement.querySelector('p:first-child');
    modalIDElement.textContent += crypto.randomUUID();
}

// 显示页面自己的源代码
function togglePageSource() {
    const sourceCodeDiv = document.getElementById("source-code");
    sourceCodeDiv.style.display = sourceCodeDiv.style.display === "none" ? "block" : "none";
    if(sourceCodeDiv.style.display === "block") {
        const pageSource = document.documentElement.outerHTML;
        document.getElementById("source-code-content").textContent = pageSource;
    }
    const buttonElement = document.getElementById("wikidot-source-button");
    buttonElement.textContent = sourceCodeDiv.style.display === "none" ? "查看源码" : "隐藏源码";

}
