import PagesStack from './components/general/PagesStack'
import Splash from './components/app/Splash'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <Splash>
      <PagesStack initial={<HomePage />} />
    </Splash>
  )
}
