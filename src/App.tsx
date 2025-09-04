import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import './App.css'
import ThemeToggle from './components/ThemeToggle'
import AnimationDemo from './components/AnimationDemo'

/**
 * 主应用组件 - 展示 DaisyUI 各种组件和功能
 * @returns JSX.Element
 */
export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [progress, setProgress] = useState(65)
  const [selectedTab, setSelectedTab] = useState<'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5' | 'tab6' | 'tab7'>('tab1')
  const [greetInput, setGreetInput] = useState('')
  const [greetResult, setGreetResult] = useState('')
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [calcA, setCalcA] = useState(0)
  const [calcB, setCalcB] = useState(0)
  const [calcOperation, setCalcOperation] = useState('add')
  const [calcResult, setCalcResult] = useState<number | string>('')
  const [randomResult, setRandomResult] = useState<number | null>(null)
  const [asyncResult, setAsyncResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tgaImageData, setTgaImageData] = useState<string | null>(null)
  const [tgaImageInfo, setTgaImageInfo] = useState<any>(null)
  const [supportedFormats, setSupportedFormats] = useState<string[]>([])

  /**
   * 处理进度条更新
   */
  const updateProgress = () => {
    setProgress(prev => prev >= 100 ? 0 : prev + 10)
  }

  /**
   * 调用 Tauri greet 命令
   */
  const handleGreet = async () => {
    try {
      setIsLoading(true)
      const result = await invoke('greet', { name: greetInput })
      setGreetResult(result as string)
    } catch (error) {
      setGreetResult(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 获取系统信息
   */
  const handleGetSystemInfo = async () => {
    try {
      setIsLoading(true)
      const result = await invoke('get_system_info')
      setSystemInfo(result)
    } catch (error) {
      console.error('Error getting system info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 执行数学计算
   */
  const handleCalculate = async () => {
    try {
      setIsLoading(true)
      const result = await invoke('calculate', {
        operation: calcOperation,
        a: calcA,
        b: calcB
      })
      setCalcResult(result as number)
    } catch (error) {
      setCalcResult(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 生成随机数
   */
  const handleGenerateRandom = async () => {
    try {
      setIsLoading(true)
      const result = await invoke('generate_random_number', {
        min: 1,
        max: 100
      })
      setRandomResult(result as number)
    } catch (error) {
      console.error('Error generating random number:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 执行异步操作
   */
  const handleAsyncOperation = async () => {
    try {
      setIsLoading(true)
      setAsyncResult('正在执行异步操作...')
      const result = await invoke('async_operation', { duration_ms: 2000 })
      setAsyncResult(result as string)
    } catch (error) {
      setAsyncResult(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 处理用户数据
   */
  const handleProcessUserData = async () => {
    try {
      setIsLoading(true)
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'developer'
      }
      const result = await invoke('process_user_data', { data: userData })
      console.log('Processed data:', result)
    } catch (error) {
      console.error('Error processing user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 选择并加载TGA图片
   */
  const handleSelectTgaImage = async () => {
    try {
      setIsLoading(true)
      console.log('🖼️ 开始选择TGA图片...')
      
      // 打开文件选择对话框
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'TGA Images',
          extensions: ['tga']
        }]
      })
      
      console.log('📁 文件选择结果:', selected)
      
      if (selected && typeof selected === 'string') {
        console.log('🔄 开始调用Rust后端加载TGA图片:', selected)
        
        // 调用Rust后端加载TGA图片
        const result = await invoke('load_tga_image', { path: selected })
        
        console.log('✅ TGA图片加载成功:', {
          width: (result as any).width,
          height: (result as any).height,
          dataLength: (result as any).data_base64?.length || 0
        })
        
        setTgaImageData((result as any).data_base64)
        setTgaImageInfo({
          width: (result as any).width,
          height: (result as any).height,
          path: selected
        })
      } else {
        console.log('❌ 用户取消了文件选择')
      }
    } catch (error) {
      console.error('❌ 加载TGA图片时发生错误:', error)
      alert(`加载TGA图片失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 获取支持的图片格式
   */
  const handleGetSupportedFormats = async () => {
    try {
      setIsLoading(true)
      const formats = await invoke('get_supported_image_formats')
      setSupportedFormats(formats as string[])
    } catch (error) {
      console.error('Error getting supported formats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 p-8 space-y-6">
      {/* 标题 + 主题切换 */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tauri + React + DaisyUI Demo</h1>
          <p className="text-base-content/70 mt-2">展示 DaisyUI 组件库的强大功能</p>
        </div>
        <ThemeToggle />
      </header>

      {/* 选项卡导航 */}
      <div className="tabs tabs-boxed bg-base-100 p-1">
        <button 
          className={`tab ${selectedTab === 'tab1' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab1')}
        >
          🎨 组件展示
        </button>
        <button 
          className={`tab ${selectedTab === 'tab2' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab2')}
        >
          📊 数据展示
        </button>
        <button 
          className={`tab ${selectedTab === 'tab3' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab3')}
        >
          🎯 交互组件
        </button>
        <button 
          className={`tab ${selectedTab === 'tab4' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab4')}
        >
          🎨 主题展示
        </button>
        <button 
          className={`tab ${selectedTab === 'tab5' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab5')}
        >
          🔧 Tauri 交互
        </button>
        <button 
          className={`tab ${selectedTab === 'tab6' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab6')}
        >
          🖼️ TGA 图片
        </button>
        <button 
          className={`tab ${selectedTab === 'tab7' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('tab7')}
        >
          ✨ 动画效果
        </button>
      </div>

      {/* 选项卡内容 */}
      {selectedTab === 'tab1' && (
        <div className="space-y-6">
          {/* 卡片示例 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">👋 欢迎体验 DaisyUI</h2>
                <p>这是一个展示常见控件的示例页面。</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">主要按钮</button>
                  <button className="btn btn-secondary">次要按钮</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
              <div className="card-body">
                <h2 className="card-title">🌈 渐变卡片</h2>
                <p>支持各种样式和颜色组合</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-ghost">了解更多</button>
                </div>
              </div>
            </div>
          </div>

          {/* 按钮组合 */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🔘 按钮样式</h2>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-accent">Accent</button>
              <button className="btn btn-info">Info</button>
              <button className="btn btn-success">Success</button>
              <button className="btn btn-warning">Warning</button>
              <button className="btn btn-error">Error</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-link">Link</button>
            </div>
            <div className="divider">按钮尺寸</div>
            <div className="flex items-center gap-2">
              <button className="btn btn-xs">XS</button>
              <button className="btn btn-sm">SM</button>
              <button className="btn">Normal</button>
              <button className="btn btn-lg">LG</button>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'tab2' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat bg-base-100 shadow">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <div className="stat-title">总点赞</div>
              <div className="stat-value text-primary">25.6K</div>
              <div className="stat-desc">21% 比上月增长</div>
            </div>
            
            <div className="stat bg-base-100 shadow">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="stat-title">页面浏览</div>
              <div className="stat-value text-secondary">2.6M</div>
              <div className="stat-desc">21% 比上月增长</div>
            </div>
            
            <div className="stat bg-base-100 shadow">
              <div className="stat-figure text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                </svg>
              </div>
              <div className="stat-title">新注册</div>
              <div className="stat-value text-accent">1,200</div>
              <div className="stat-desc">↗︎ 400 (22%)</div>
            </div>
            
            <div className="stat bg-base-100 shadow">
              <div className="stat-figure text-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title">活跃用户</div>
              <div className="stat-value text-info">86%</div>
              <div className="stat-desc">↘︎ 90 (14%)</div>
            </div>
          </div>

          {/* 进度条展示 */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📊 进度展示</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>项目进度</span>
                  <span>{progress}%</span>
                </div>
                <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>任务完成</span>
                  <span>78%</span>
                </div>
                <progress className="progress progress-secondary w-full" value="78" max="100"></progress>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>代码覆盖率</span>
                  <span>92%</span>
                </div>
                <progress className="progress progress-accent w-full" value="92" max="100"></progress>
              </div>
              <button className="btn btn-outline" onClick={updateProgress}>
                更新进度
              </button>
            </div>
          </div>

          {/* 表格 */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">👥 用户列表</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>姓名</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>1</th>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                              A
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Alice Johnson</div>
                          <div className="text-sm opacity-50">alice@example.com</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">管理员</span>
                    </td>
                    <td><span className="badge badge-success">在线</span></td>
                    <td>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-xs">操作</label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>编辑</a></li>
                          <li><a>删除</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>2</th>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <div className="bg-secondary text-secondary-content flex items-center justify-center w-full h-full">
                              B
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Bob Smith</div>
                          <div className="text-sm opacity-50">bob@example.com</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">用户</span>
                    </td>
                    <td><span className="badge badge-error">离线</span></td>
                    <td>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-xs">操作</label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>编辑</a></li>
                          <li><a>删除</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>3</th>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <div className="bg-accent text-accent-content flex items-center justify-center w-full h-full">
                              C
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Carol Davis</div>
                          <div className="text-sm opacity-50">carol@example.com</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-accent">编辑</span>
                    </td>
                    <td><span className="badge badge-warning">忙碌</span></td>
                    <td>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-xs">操作</label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>编辑</a></li>
                          <li><a>删除</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'tab3' && (
        <div className="space-y-6">
          {/* 表单控件 */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📋 表单示例</h2>
            <form className="space-y-4">
              <input type="text" placeholder="输入用户名" className="input input-bordered w-full" />
              <input type="password" placeholder="输入密码" className="input input-bordered w-full" />
              <select className="select select-bordered w-full">
                <option>请选择角色</option>
                <option>管理员</option>
                <option>用户</option>
              </select>
              <label className="label cursor-pointer">
                <span className="label-text">记住我</span>
                <input type="checkbox" className="checkbox checkbox-primary" />
              </label>
              <button type="submit" className="btn btn-accent w-full">提交</button>
            </form>
          </div>

          {/* 模态框示例 */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🪟 模态框</h2>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              打开模态框
            </button>
            
            {modalOpen && (
              <div className="modal modal-open">
                <div className="modal-box">
                  <h3 className="font-bold text-lg">🎉 恭喜！</h3>
                  <p className="py-4">这是一个模态框示例，展示了 DaisyUI 的模态框组件。</p>
                  <div className="modal-action">
                    <button className="btn" onClick={() => setModalOpen(false)}>关闭</button>
                    <button className="btn btn-primary" onClick={() => setModalOpen(false)}>确认</button>
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* 提示框 + 加载 */}
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>这是一个信息提示框。</span>
            </div>
            <div className="alert alert-success">
              <span>操作成功完成！</span>
            </div>
            <div className="alert alert-warning">
              <span>请注意这个警告信息。</span>
            </div>
            <div className="alert alert-error">
              <span>发生了一个错误。</span>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">⏳ 加载状态</h2>
             <div className="flex gap-4 items-center flex-wrap">
               <span>加载中：</span>
               <span className="loading loading-spinner loading-md"></span>
               <span className="loading loading-ring loading-md"></span>
               <span className="loading loading-dots loading-md"></span>
               <span className="loading loading-ball loading-md"></span>
             </div>
           </div>

           {/* 其他组件 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card bg-base-100 shadow-md p-6">
               <h2 className="text-xl font-semibold mb-4">🎨 颜色展示</h2>
               <div className="flex flex-wrap gap-2">
                 <div className="badge badge-primary">Primary</div>
                 <div className="badge badge-secondary">Secondary</div>
                 <div className="badge badge-accent">Accent</div>
                 <div className="badge badge-neutral">Neutral</div>
                 <div className="badge badge-info">Info</div>
                 <div className="badge badge-success">Success</div>
                 <div className="badge badge-warning">Warning</div>
                 <div className="badge badge-error">Error</div>
               </div>
             </div>

             <div className="card bg-base-100 shadow-md p-6">
               <h2 className="text-xl font-semibold mb-4">📱 响应式按钮</h2>
               <div className="flex flex-wrap gap-2">
                 <button className="btn btn-xs">超小</button>
                 <button className="btn btn-sm">小</button>
                 <button className="btn">正常</button>
                 <button className="btn btn-lg">大</button>
               </div>
               <div className="flex flex-wrap gap-2 mt-4">
                 <button className="btn btn-outline">轮廓</button>
                 <button className="btn btn-ghost">幽灵</button>
                 <button className="btn btn-link">链接</button>
                 <button className="btn btn-active">激活</button>
                 <button className="btn" disabled>禁用</button>
               </div>
             </div>
           </div>
         </div>
       )}

       {selectedTab === 'tab4' && (
         <div className="space-y-6">
           {/* 主题展示 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">🎨 主题展示</h2>
             <p className="mb-4">当前主题会影响整个应用的颜色方案。尝试切换不同的主题来查看效果！</p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-primary text-primary-content p-4 rounded-lg text-center">
                 <div className="font-bold">Primary</div>
                 <div className="text-sm opacity-75">主要色</div>
               </div>
               <div className="bg-secondary text-secondary-content p-4 rounded-lg text-center">
                 <div className="font-bold">Secondary</div>
                 <div className="text-sm opacity-75">次要色</div>
               </div>
               <div className="bg-accent text-accent-content p-4 rounded-lg text-center">
                 <div className="font-bold">Accent</div>
                 <div className="text-sm opacity-75">强调色</div>
               </div>
               <div className="bg-neutral text-neutral-content p-4 rounded-lg text-center">
                 <div className="font-bold">Neutral</div>
                 <div className="text-sm opacity-75">中性色</div>
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
               <div className="bg-info text-info-content p-4 rounded-lg text-center">
                 <div className="font-bold">Info</div>
                 <div className="text-sm opacity-75">信息色</div>
               </div>
               <div className="bg-success text-success-content p-4 rounded-lg text-center">
                 <div className="font-bold">Success</div>
                 <div className="text-sm opacity-75">成功色</div>
               </div>
               <div className="bg-warning text-warning-content p-4 rounded-lg text-center">
                 <div className="font-bold">Warning</div>
                 <div className="text-sm opacity-75">警告色</div>
               </div>
               <div className="bg-error text-error-content p-4 rounded-lg text-center">
                 <div className="font-bold">Error</div>
                 <div className="text-sm opacity-75">错误色</div>
               </div>
             </div>
           </div>

           {/* 主题切换说明 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">🔄 主题切换功能</h2>
             <div className="space-y-4">
               <p>DaisyUI 提供了多种内置主题，包括：</p>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                 <div className="badge badge-outline">light</div>
                 <div className="badge badge-outline">dark</div>
                 <div className="badge badge-outline">cupcake</div>
                 <div className="badge badge-outline">bumblebee</div>
                 <div className="badge badge-outline">emerald</div>
                 <div className="badge badge-outline">corporate</div>
                 <div className="badge badge-outline">synthwave</div>
                 <div className="badge badge-outline">retro</div>
                 <div className="badge badge-outline">cyberpunk</div>
                 <div className="badge badge-outline">valentine</div>
                 <div className="badge badge-outline">halloween</div>
                 <div className="badge badge-outline">garden</div>
               </div>
               <p className="text-sm opacity-75">
                 点击右上角的主题切换按钮来体验不同主题的效果。主题切换会立即应用到整个应用。
               </p>
             </div>
           </div>

           {/* 组件预览 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">🧩 组件预览</h2>
             <div className="space-y-6">
               {/* 按钮组 */}
               <div>
                 <h3 className="font-semibold mb-2">按钮样式</h3>
                 <div className="flex flex-wrap gap-2">
                   <button className="btn btn-primary">Primary</button>
                   <button className="btn btn-secondary">Secondary</button>
                   <button className="btn btn-accent">Accent</button>
                   <button className="btn btn-info">Info</button>
                   <button className="btn btn-success">Success</button>
                   <button className="btn btn-warning">Warning</button>
                   <button className="btn btn-error">Error</button>
                 </div>
               </div>

               {/* 输入框 */}
               <div>
                 <h3 className="font-semibold mb-2">输入框样式</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" placeholder="默认输入框" className="input input-bordered w-full" />
                   <input type="text" placeholder="Primary" className="input input-bordered input-primary w-full" />
                   <input type="text" placeholder="Secondary" className="input input-bordered input-secondary w-full" />
                   <input type="text" placeholder="Accent" className="input input-bordered input-accent w-full" />
                 </div>
               </div>

               {/* 徽章 */}
               <div>
                 <h3 className="font-semibold mb-2">徽章样式</h3>
                 <div className="flex flex-wrap gap-2">
                   <div className="badge">默认</div>
                   <div className="badge badge-primary">Primary</div>
                   <div className="badge badge-secondary">Secondary</div>
                   <div className="badge badge-accent">Accent</div>
                   <div className="badge badge-ghost">Ghost</div>
                   <div className="badge badge-outline">Outline</div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

             {selectedTab === 'tab5' && (
         <div className="space-y-6">
           {/* 基础 Greet 命令 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">👋 基础问候命令</h2>
             <div className="space-y-4">
               <div className="mockup-code">
                 <pre data-prefix="#"><code>Rust 后端命令</code></pre>
                 <pre data-prefix=">"><code>{`fn greet(name: &str) -> String`}</code></pre>
               </div>
               
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="输入您的名称" 
                   className="input input-bordered flex-1"
                   value={greetInput}
                   onChange={(e) => setGreetInput(e.target.value)}
                 />
                 <button 
                   className="btn btn-primary"
                   onClick={handleGreet}
                   disabled={isLoading || !greetInput.trim()}
                 >
                   {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '问候'}
                 </button>
               </div>
               
               {greetResult && (
                 <div className="alert alert-success">
                   <span>{greetResult}</span>
                 </div>
               )}
             </div>
           </div>

           {/* 系统信息 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">💻 系统信息</h2>
             <div className="space-y-4">
               <button 
                 className="btn btn-info"
                 onClick={handleGetSystemInfo}
                 disabled={isLoading}
               >
                 {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '获取系统信息'}
               </button>
               
               {systemInfo && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="stat bg-base-200">
                     <div className="stat-title">操作系统</div>
                     <div className="stat-value text-primary">{systemInfo.os}</div>
                   </div>
                   <div className="stat bg-base-200">
                     <div className="stat-title">架构</div>
                     <div className="stat-value text-secondary">{systemInfo.arch}</div>
                   </div>
                   <div className="stat bg-base-200">
                     <div className="stat-title">版本</div>
                     <div className="stat-value text-accent">{systemInfo.version}</div>
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* 数学计算器 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">🧮 数学计算器</h2>
             <div className="space-y-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <input 
                   type="number" 
                   placeholder="数字 A"
                   className="input input-bordered"
                   value={calcA}
                   onChange={(e) => setCalcA(Number(e.target.value))}
                 />
                 <select 
                   className="select select-bordered"
                   value={calcOperation}
                   onChange={(e) => setCalcOperation(e.target.value)}
                 >
                   <option value="add">加法 (+)</option>
                   <option value="subtract">减法 (-)</option>
                   <option value="multiply">乘法 (×)</option>
                   <option value="divide">除法 (÷)</option>
                 </select>
                 <input 
                   type="number" 
                   placeholder="数字 B"
                   className="input input-bordered"
                   value={calcB}
                   onChange={(e) => setCalcB(Number(e.target.value))}
                 />
                 <button 
                   className="btn btn-accent"
                   onClick={handleCalculate}
                   disabled={isLoading}
                 >
                   {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '计算'}
                 </button>
               </div>
               
               {calcResult !== '' && (
                 <div className="alert alert-info">
                   <span>计算结果: {calcResult}</span>
                 </div>
               )}
             </div>
           </div>

           {/* 随机数生成和异步操作 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card bg-base-100 shadow-md p-6">
               <h2 className="text-xl font-semibold mb-4">🎲 随机数生成</h2>
               <div className="space-y-4">
                 <button 
                   className="btn btn-success w-full"
                   onClick={handleGenerateRandom}
                   disabled={isLoading}
                 >
                   {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '生成随机数 (1-100)'}
                 </button>
                 
                 {randomResult !== null && (
                   <div className="text-center">
                     <div className="text-4xl font-bold text-primary">{randomResult}</div>
                     <div className="text-sm opacity-75">随机生成的数字</div>
                   </div>
                 )}
               </div>
             </div>

             <div className="card bg-base-100 shadow-md p-6">
               <h2 className="text-xl font-semibold mb-4">⏱️ 异步操作</h2>
               <div className="space-y-4">
                 <button 
                   className="btn btn-warning w-full"
                   onClick={handleAsyncOperation}
                   disabled={isLoading}
                 >
                   {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '执行异步操作 (2秒)'}
                 </button>
                 
                 {asyncResult && (
                   <div className="alert alert-success">
                     <span>{asyncResult}</span>
                   </div>
                 )}
               </div>
             </div>
           </div>

           {/* 数据处理 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">📊 数据处理</h2>
             <div className="space-y-4">
               <p className="text-sm opacity-75">点击按钮处理示例用户数据，结果将在浏览器控制台中显示。</p>
               <button 
                 className="btn btn-outline"
                 onClick={handleProcessUserData}
                 disabled={isLoading}
               >
                 {isLoading ? <span className="loading loading-spinner loading-sm"></span> : '处理用户数据'}
               </button>
               
               <div className="mockup-code text-xs">
                 <pre data-prefix=">"><code>输入: {'{'}name: "John Doe", email: "john@example.com", role: "developer"{'}'}</code></pre>
                 <pre data-prefix=">"><code>输出: 处理后的数据 + 时间戳</code></pre>
               </div>
             </div>
           </div>

           {/* 技术说明 */}
           <div className="card bg-base-100 shadow-md p-6">
             <h2 className="text-xl font-semibold mb-4">📚 技术说明</h2>
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <h3 className="font-semibold mb-2">前端技术栈</h3>
                   <div className="space-y-1 text-sm">
                     <div className="badge badge-outline">React + TypeScript</div>
                     <div className="badge badge-outline">Tauri API</div>
                     <div className="badge badge-outline">DaisyUI + Tailwind</div>
                   </div>
                 </div>
                 <div>
                   <h3 className="font-semibold mb-2">后端技术栈</h3>
                   <div className="space-y-1 text-sm">
                     <div className="badge badge-outline">Rust + Tauri</div>
                     <div className="badge badge-outline">Serde JSON</div>
                     <div className="badge badge-outline">Tokio Async</div>
                   </div>
                 </div>
               </div>
               
               <div className="divider"></div>
               
               <p className="text-sm opacity-75">
                 这个示例展示了 Tauri 应用中前端 React 组件与 Rust 后端命令的完整交互流程。
                 所有的数据传输都通过 Tauri 的 IPC (进程间通信) 机制实现，确保了安全性和性能。
               </p>
             </div>
           </div>
         </div>
       )}

       {selectedTab === 'tab6' && (
         <div className="space-y-6">
           {/* TGA图片加载器 */}
           <div className="card bg-base-100 shadow-xl">
             <div className="card-body">
               <h2 className="card-title">🖼️ TGA 图片加载器</h2>
               <p className="text-base-content/70">使用集成的 C++ 库加载和显示 TGA 格式图片</p>
               
               <div className="card-actions justify-start gap-2 mt-4">
                 <button 
                   className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                   onClick={handleSelectTgaImage}
                   disabled={isLoading}
                 >
                   {isLoading ? '加载中...' : '选择 TGA 图片'}
                 </button>
                 
                 <button 
                   className={`btn btn-outline ${isLoading ? 'loading' : ''}`}
                   onClick={handleGetSupportedFormats}
                   disabled={isLoading}
                 >
                   获取支持格式
                 </button>
               </div>

               {/* 支持的格式显示 */}
               {supportedFormats.length > 0 && (
                 <div className="mt-4">
                   <h3 className="font-semibold mb-2">支持的图片格式：</h3>
                   <div className="flex flex-wrap gap-2">
                     {supportedFormats.map((format, index) => (
                       <div key={index} className="badge badge-secondary">{format}</div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* 图片显示区域 */}
           {tgaImageData && tgaImageInfo && (
             <div className="card bg-base-100 shadow-xl">
               <div className="card-body">
                 <h2 className="card-title">📷 图片预览</h2>
                 
                 {/* 图片信息 */}
                 <div className="stats stats-horizontal shadow mb-4">
                   <div className="stat">
                     <div className="stat-title">宽度</div>
                     <div className="stat-value text-primary">{tgaImageInfo.width}px</div>
                   </div>
                   <div className="stat">
                     <div className="stat-title">高度</div>
                     <div className="stat-value text-secondary">{tgaImageInfo.height}px</div>
                   </div>
                   <div className="stat">
                     <div className="stat-title">格式</div>
                     <div className="stat-value text-accent">TGA</div>
                   </div>
                 </div>

                 {/* 文件路径 */}
                 <div className="mb-4">
                   <label className="label">
                     <span className="label-text font-semibold">文件路径：</span>
                   </label>
                   <div className="bg-base-200 p-2 rounded text-sm font-mono break-all">
                     {tgaImageInfo.path}
                   </div>
                 </div>

                 {/* 图片显示 */}
                 <div className="flex justify-center">
                   <div className="max-w-full overflow-auto border border-base-300 rounded-lg">
                     <img 
                       src={`data:image/png;base64,${tgaImageData}`}
                       alt="TGA Image"
                       className="max-w-none"
                       style={{ maxHeight: '500px' }}
                     />
                   </div>
                 </div>

                 <div className="card-actions justify-end mt-4">
                   <button 
                     className="btn btn-outline btn-sm"
                     onClick={() => {
                       setTgaImageData(null)
                       setTgaImageInfo(null)
                     }}
                   >
                     清除图片
                   </button>
                 </div>
               </div>
             </div>
           )}

           {/* 使用说明 */}
           <div className="card bg-gradient-to-r from-info to-accent text-info-content shadow-xl">
             <div className="card-body">
               <h2 className="card-title">💡 使用说明</h2>
               <div className="space-y-2 text-sm">
                 <p>• 点击"选择 TGA 图片"按钮选择本地的 .tga 格式图片文件</p>
                 <p>• 图片将通过集成的 C++ 库 (stb_image + tga_loader) 进行解析</p>
                 <p>• 解析后的图片数据会转换为 Base64 格式在前端显示</p>
                 <p>• 支持显示图片的基本信息：尺寸、格式和文件路径</p>
                 <p>• 这个功能展示了 Tauri 应用中 Rust FFI 调用 C++ 库的完整流程</p>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Tab 7: 动画效果展示 */}
       {selectedTab === 'tab7' && (
         <div className="space-y-6">
           <AnimationDemo />
         </div>
       )}
     </div>
   )
 }
