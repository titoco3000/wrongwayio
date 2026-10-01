import PagesStack from './components/PagesStack'
import Splash from './components/Splash'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <Splash>
      <PagesStack initial={<HomePage />} />
    </Splash>
  )
}
