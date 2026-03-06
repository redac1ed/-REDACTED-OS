import React, { useState } from 'react'
import {
  MdArrowBack, MdArrowForward, MdHome,
  MdDesktopWindows, MdDownload, MdDescription,
  MdImage, MdMusicNote, MdMovie, MdComputer,
  MdGridView, MdSearch, MdFolder, MdChevronRight,
  MdViewList, MdInsertDriveFile,
} from 'react-icons/md'
import { useFileSystem } from '../../contexts/FileSystemContext'

const QUICK_ACCESS = [
  { name: 'Desktop', path: ['Desktop'], icon: <MdDesktopWindows />, color: '#4facfe', type: 'folder', pinned: true },
  { name: 'Downloads', path: ['Downloads'], icon: <MdDownload />, color: '#43e97b', type: 'folder', pinned: true },
  { name: 'Documents', path: ['Documents'], icon: <MdDescription />, color: '#fbc2eb', type: 'folder', pinned: true },
  { name: 'Pictures', path: ['Pictures'], icon: <MdImage />, color: '#4facfe', type: 'folder', pinned: true },
  { name: 'Music', path: ['Music'], icon: <MdMusicNote />, color: '#fa709a', type: 'folder', pinned: true },
  { name: 'Videos', path: ['Videos'], icon: <MdMovie />, color: '#a18cd1', type: 'folder', pinned: true }
]

const RECENT_FILES = [
  { name: 'note', path: 'Documents', date: '18-02-2026 20:10', type: 'doc' },
]

function NavItem({ icon, label, active, hasArrow, indent = 0, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        paddingLeft: `${12 + indent * 20}px`,
        borderRadius: '4px',
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        cursor: 'pointer',
        fontSize: '13px',
        color: '#fff',
        marginBottom: '2px'
      }} className="nav-hover">
      {hasArrow && (
         <svg viewBox="0 0 24 24" width="16" height="16" fill="rgba(255,255,255,0.5)" style={{ marginRight: '4px' }}>
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
         </svg>
      )}
      <div style={{ marginRight: '12px', opacity: 0.9, display: 'flex' }}>{icon}</div>
      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </div>
  )
}

export default function FileExplorer() {
  const { readdir } = useFileSystem();
  const [currentPath, setCurrentPath] = useState('Home'); // 'Home' or array of strings
  const [history, setHistory] = useState(['Home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = (path) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSearchQuery('');
  }
  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
    }
  }
  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
    }
  }
  const getBreadcrumbs = () => {
    if (currentPath === 'Home') return <><MdHome size={16} style={{ marginRight: '8px', opacity: 0.7 }} /><span style={{ opacity: 0.5, margin: '0 6px' }}>{'>'}</span> Home</>;
    return (
      <>
        <MdComputer size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
        <span style={{ opacity: 0.5, margin: '0 6px' }}>{'>'}</span>
        {currentPath.length === 0 ? 'My PC' : currentPath.join(' > ')}
      </>
    );
  }

  const files = Array.isArray(currentPath) ? readdir(currentPath) : [];
  const filteredFiles = searchQuery 
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) 
    : files;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#191919',
      color: '#fff',
      fontFamily: '"Segoe UI", sans-serif',
      fontSize: '14px',
      userSelect: 'none'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        gap: '12px',
        background: '#191919',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
         <div style={{ display: 'flex', gap: '4px' }}>
            <button className="icon-btn" onClick={goBack} disabled={historyIndex === 0}><MdArrowBack style={{ opacity: historyIndex === 0 ? 0.4 : 1 }}/></button>
            <button className="icon-btn" onClick={goForward} disabled={historyIndex === history.length - 1}><MdArrowForward style={{ opacity: historyIndex === history.length - 1 ? 0.4 : 1 }} /></button>
         </div>
         
         {/* Address Bar */}
         <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '40px',
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid rgba(255,255,255,0.05)'
         }}>
            {getBreadcrumbs()}
         </div>

         {/* Search Bar */}
         <div style={{
            width: '240px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '40px',
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid rgba(255,255,255,0.05)'
         }}>
            <MdSearch size={18} style={{ marginRight: '8px', opacity: 0.7 }} />
            <input 
               type="text" 
               placeholder="Search" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  color: '#fff',
                  width: '100%',
                  outline: 'none',
                  opacity: 0.6
               }}
            />
         </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
         
         {/* Sidebar */}
         <div style={{
            width: '240px',
            padding: '12px 6px',
            background: '#191919',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto'
         }}>
            <NavItem 
                icon={<MdHome size={18} color="#4cc2ff" />} 
                label="Home" 
                active={currentPath === 'Home'} 
                onClick={() => navigate('Home')}
            />
            {QUICK_ACCESS.map((item, i) => (
                <NavItem 
                    key={i}
                    icon={React.cloneElement(item.icon, { size: 18, color: item.color })} 
                    label={item.name} 
                    active={Array.isArray(currentPath) && currentPath.length > 0 && currentPath[0] === item.path[0]} 
                    pinned
                    onClick={() => navigate(item.path)}
                />
            ))}
         </div>
         
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1c1c1c' }}>
            <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
               
               {currentPath === 'Home' ? (
                   <>
                   {/* Quick Access Section */}
                   <div style={{ padding: '20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                         <div style={{ marginRight: '8px' }}>▼</div>
                         <div style={{ fontWeight: 600, fontSize: '14px' }}>Quick access</div>
                      </div>
                      
                      <div style={{ 
                         display: 'grid', 
                         gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                         gap: '8px' 
                      }}>
                         {QUICK_ACCESS.map((item, i) => (
                            <div key={i} 
                            onClick={() => navigate(item.path)}
                            style={{
                               display: 'flex',
                               alignItems: 'center',
                               padding: '12px',
                               gap: '12px',
                               borderRadius: '4px',
                               cursor: 'pointer',
                               background: 'transparent'
                            }} className="file-grid-item">
                               <div style={{ position: 'relative' }}>
                                  {React.cloneElement(item.icon, { size: 40, color: item.color })}
                                  {item.pinned && (
                                     <div style={{
                                        position: 'absolute',
                                        bottom: -2,
                                        right: -2,
                                        background: '#1c1c1c',
                                        borderRadius: '50%',
                                        padding: '1px'
                                     }}>
                                        <MdCheckCircle size={12} color="#888" />
                                     </div>
                                  )}
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                                  <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.type === 'folder' ? 'Stored locally' : ''}</span>
                               </div>
                               <div style={{ marginLeft: 'auto', opacity: 0.4 }}>
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 12l-2.29-2.29 1.41-1.41L20 12l-4.88 3.71-1.41-1.41L16 12z"/></svg>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
    
                   {/* Recent Files Section */}
                   <div style={{ padding: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '24px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                               <div style={{ marginRight: '8px' }}>▼</div>
                               <div style={{ fontWeight: 600, fontSize: '14px' }}>Recents</div>
                            </div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1.5fr 1fr', padding: '8px 12px', fontSize: '12px', opacity: 0.7, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div></div>
                            <div>Name</div>
                            <div>Date accessed</div>
                            <div>Activity</div>
                            <div></div>
                         </div>
                         
                         {RECENT_FILES.map((file, i) => (
                            <div key={i} style={{ 
                               display: 'grid', 
                               gridTemplateColumns: '40px 2fr 1.5fr 1.5fr 1fr', 
                               padding: '10px 12px', 
                               alignItems: 'center',
                               fontSize: '13px',
                               cursor: 'default'
                            }} className="file-list-row">
                               <div>
                                  {file.type === 'json' && <MdDescription size={20} color="#fbc2eb" />}
                                  {file.type === 'image' && <MdImage size={20} color="#4facfe" />}
                                  {file.type === 'doc' && <MdDescription size={20} color="#4facfe" />}
                                  {file.type === 'code' && <MdDescription size={20} color="#f6d365" />}
                                  {file.type === 'sheet' && <MdDescription size={20} color="#43e97b" />}
                                  {file.type === 'video' && <MdMovie size={20} color="#a18cd1" />}
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span>{file.name}</span>
                                  <span style={{ fontSize: '11px', opacity: 0.5 }}>{file.path}</span>
                               </div>
                               <div style={{ opacity: 0.7 }}>{file.date}</div>
                               <div></div>
                               <div></div>
                            </div>
                         ))}
                      </div>
                   </div>
                   </>
               ) : (
                   <div style={{ padding: '20px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                            {filteredFiles.length === 0 && <div style={{ opacity: 0.5, padding: '20px' }}>{searchQuery ? 'No results found.' : 'This folder is empty.'}</div>}
                            {filteredFiles.map((file, i) => (
                                <div key={i}
                                    onClick={() => {
                                        if (file.type === 'folder') {
                                            navigate([...currentPath, file.name]);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                    className="file-grid-item"
                                 >
                                    {file.type === 'folder' ? (
                                        <MdFolder size={48} color="#ffe68e" />
                                    ) :
                                    file.type === 'video' ? (
                                        <MdMovie size={48} color="#a18cd1" />
                                    ) : 
                                    file.type === 'music' ? (
                                        <MdMusicNote size={48} color="#43e97b" />
                                    ) : 
                                    file.type === 'apps' ? (
                                        <img src={file.icon} width={48} height={48} />
                                    ) : 
                                    file.type === 'doc' ? (
                                        <MdDescription size={48} color="#4facfe" />
                                    ) : 
                                    file.type === 'txt' ? (
                                        <MdDescription size={48} color="#5c5c5c" />
                                    ) :
                                    file.type === 'image' ? (
                                        <MdImage size={48} color="#4facfe" />
                                    ) : (
                                        <MdDescription size={48} color="#ccc" />
                                    )}
                                    <span style={{ marginTop: '8px', fontSize: '13px', textAlign: 'center', wordBreak: 'break-word' }}>{file.name}</span>
                                </div>
                            ))}
                        </div>
                   </div>
               )}

            </div>
         </div>
      </div>

      <style>{`
         .icon-btn {
            background: transparent;
            border: none;
            color: #fff;
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
         }
         .icon-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.1);
         }
         .toolbar-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
         }
         .toolbar-btn:hover {
            background: rgba(255,255,255,0.1);
         }
         .toolbar-icon {
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
         }
         .toolbar-icon:hover {
            background: rgba(255,255,255,0.1);
         }
         .nav-hover:hover {
            background: rgba(255,255,255,0.06) !important;
         }
         .file-grid-item:hover {
            background: rgba(255,255,255,0.04) !important;
         }
         .file-list-row:hover {
            background: rgba(255,255,255,0.04);
         }
      `}</style>
    </div>
  )
}