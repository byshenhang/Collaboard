import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Framer Motion 动画示例组件
 * 展示多种动画效果：淡入淡出、缩放、旋转、弹簧动画、手势交互等
 */
const AnimationDemo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  // 卡片数据
  const cards = [
    { id: 1, title: '淡入动画', color: 'bg-blue-500', description: '基础淡入淡出效果' },
    { id: 2, title: '弹簧动画', color: 'bg-green-500', description: '弹性动画效果' },
    { id: 3, title: '旋转缩放', color: 'bg-purple-500', description: '组合变换动画' },
    { id: 4, title: '手势交互', color: 'bg-red-500', description: '拖拽和点击交互' }
  ];

  // 动画变体配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100
      }
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20
      }
    },
    tap: {
      scale: 0.95
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    }
  };

  const counterVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* 标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🎨 Framer Motion 动画展示
        </h1>
        <p className="text-gray-600 text-lg">
          体验各种精美的动画效果和交互
        </p>
      </motion.div>

      {/* 控制按钮区域 */}
      <motion.div 
        className="flex justify-center gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsVisible(!isVisible)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium shadow-lg hover:bg-blue-600 transition-colors"
        >
          {isVisible ? '隐藏卡片' : '显示卡片'}
        </motion.button>
        
        <motion.button
          variants={counterVariants}
          initial="initial"
          animate={count > 0 ? "animate" : "initial"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium shadow-lg hover:bg-green-600 transition-colors"
        >
          计数器: {count}
        </motion.button>
      </motion.div>

      {/* 浮动装饰元素 */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="fixed top-20 right-20 w-16 h-16 bg-yellow-400 rounded-full opacity-20 pointer-events-none"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '1s' }}
        className="fixed bottom-20 left-20 w-12 h-12 bg-pink-400 rounded-full opacity-20 pointer-events-none"
      />

      {/* 卡片网格 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {cards.map((card) => (
              <motion.div
                key={card.id}
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
                drag
                dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                dragElastic={0.2}
                onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                className={`${card.color} p-6 rounded-xl shadow-lg cursor-pointer text-white relative overflow-hidden`}
              >
                {/* 背景光效 */}
                <motion.div
                  className="absolute inset-0 bg-white opacity-0"
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <motion.h3 
                  className="text-xl font-bold mb-2"
                  animate={{ 
                    scale: selectedCard === card.id ? 1.1 : 1,
                    color: selectedCard === card.id ? '#fbbf24' : '#ffffff'
                  }}
                >
                  {card.title}
                </motion.h3>
                
                <motion.p 
                  className="text-sm opacity-90"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  {card.description}
                </motion.p>
                
                {/* 选中指示器 */}
                <AnimatePresence>
                  {selectedCard === card.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                    >
                      <span className="text-xs">✓</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* 拖拽提示 */}
                <motion.div
                  className="absolute bottom-2 right-2 text-xs opacity-50"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  可拖拽
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部信息 */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-center mt-12 p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🎯 动画特性展示
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>✨ 淡入淡出</div>
          <div>🔄 旋转缩放</div>
          <div>🎪 弹簧动画</div>
          <div>👆 手势交互</div>
          <div>🎨 渐变过渡</div>
          <div>📱 拖拽操作</div>
          <div>⚡ 状态动画</div>
          <div>🌊 流畅体验</div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnimationDemo;