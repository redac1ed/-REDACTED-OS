import { createContext, useContext, useState, useCallback } from 'react';

const FileSystemContext = createContext();

const INITIAL_FS = {
  name: 'root',
  type: 'folder',
  children: {
    Desktop: {
      type: 'folder',
      children: {
        "Chrome" : { type: 'apps', content: '', icon: 'https://img.icons8.com/fluency/48/chrome.png' },
        "Terminal" : { type: 'apps', content: '', icon: 'https://img.icons8.com/fluency/48/console.png' },
        "VS Code" : { type: 'apps', content: '', icon: 'https://img.icons8.com/?id=0OQR1FYCuA9f&format=png' },
        "Doom" : { type: 'apps', content: '', icon: 'https://img.icons8.com/?id=e7DUzb65WlzN&format=png' },
        "LibreOffice" : { type: 'apps', content: '', icon: 'https://img.icons8.com/?id=jUEbKTar71TV&format=jpg' },
        "Minecraft" : { type: 'apps', content: '', icon: 'https://img.icons8.com/?id=aFKNWWquUYRN&format=png' },
      }
    },
    Documents: {
      type: 'folder',
      children: {
        'note.txt': { type: 'txt', content: `Here are all the easter eggs you can find!

 Open up the terminal and run rm -rf / --no-preserve-root. It would load a video that would run indefinitely unless you do not remove the cookie for this.

 more coming soon!
` },
        'troubleshoots.txt': { type: 'txt', content: `Sometimes, while using Browser or LibreOffice, you might face some errors, to which some fixes are:

No resources left: Many people are using them, that means you would not be able to use it unless the current users exit it.

Something went wrong: This might be your network issue or a server-side one, it should resolve in about 4-5 minutes.

If you encounter any other errors, then its just a matter of time till I personally try fixing it.

PS: These apps are pretty heavy, so they might take some time to load.` }
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
