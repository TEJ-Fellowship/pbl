import { ThemeProvider } from 'next-themes'
import NewsFeed from './components/NewsFeed'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
    <div>
      <NewsFeed />
    </div>
  </ThemeProvider>
   
  )
}

export default App
