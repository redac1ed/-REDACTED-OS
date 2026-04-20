import { createContext, useContext, useState, useCallback } from 'react';

const FileSystemContext = createContext();
const INITIAL_FS = {
  name: 'root',
  type: 'folder',
  children: {
    Desktop: {
      type: 'folder',
      children: {
        "Chrome" : { type: 'apps', content: '', icon: '/icons/chrome.png' },
        "Terminal" : { type: 'apps', content: '', icon: '/icons/terminal.png' },
        "VS Code" : { type: 'apps', content: '', icon: '/icons/vscode.png' },
        "Doom" : { type: 'apps', content: '', icon: '/icons/doom.png' },
        "LibreOffice" : { type: 'apps', content: '', icon: '/icons/libreoffice.jpg' },
        "Minecraft" : { type: 'apps', content: '', icon: '/icons/minecraft.png' },
      }
    },
    Documents: {
      type: 'folder',
      children: {
        'note.txt': { type: 'txt', content: `Here are all the easter eggs you can find!

 There is a puzzle app, where you need the password.

 To find the password, you need to play the sans iconic fight on the url that is outputted in the console.

 After you get the pin, you can enter it in the puzzle app.

 I don't think I need to spoil the secret of what is contained there.

 more coming soon!
` },
        'troubleshoots.txt': { type: 'txt', content: `Sometimes, while using Browser, LibreOffice or Music, you might face some errors, to which some fixes are:

Takes a lot of time: It might be your internet speed or connectivity issue.
Does not load at all: This might be your network issue or a server-side one, it should resolve in about 4-5 minutes.
Failed to stream: This is also a common issue, indicating that the streaming server is overloaded or facing issues. Just wait a bit and try again!

If you encounter any other errors, then its just a matter of time till I personally try fixing it.
` }
      }
    },
    Downloads: {
      type: 'folder',
      children: {
        'installer.exe': { type: 'exe', content: '' },
        'image.png': { type: 'image', content: 'https://i.imgflip.com/a9zzjo.jpg?a492288' }
      }
    },
    Pictures: {
      type: 'folder',
      children: {
        'screenshot.png': { type: 'image', content: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRphqJQ-QDhQNIdzvkuK3Cp1WgVE2rF0MVRLQ&s' }
      }
    },
    Music: {
      type: 'folder',
      children: {
        'song.mp3': { type: 'music', content: 'song.mp3' }
      }
    },
    Videos: {
      type: 'folder',
      children: {
        'rm-rf-meme.mp4': { type: 'video', content: 'rm-rf-meme.mp4' }
      }
    }
  }
};

export const FileSystemProvider = ({ children }) => {
  const [fs, setFs] = useState(INITIAL_FS);
  const getNode = useCallback((pathArray) => {
    let current = fs;
    for (const key of pathArray) {
      if (current.children && current.children[key]) {
        current = current.children[key];
      } else {
        return null;
      }
    }
    return current;
  }, [fs]);
  const readdir = useCallback((pathArray) => {
    const node = getNode(pathArray);
    if (node && node.type === 'folder' && node.children) {
      return Object.entries(node.children).map(([key, value]) => ({
        name: key,
        ...value
      }));
    }
    return [];
  }, [getNode]);

  return (
    <FileSystemContext.Provider value={{ fs, readdir, getNode }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => useContext(FileSystemContext);
