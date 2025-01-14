import { Stopwatch } from '@/components/stopwatch'
// import { Timer } from "@/components/timer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock as ClockIcon, Timer as TimerIcon } from 'lucide-react'
import { Timer } from './components/timer'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="mb-8 w-full">
            <TabsTrigger value="timer" className="w-full">
              {/* select-none otherwise this gets selected when you're clicking circle and toggling states */}
              <div className="flex select-none items-center gap-2">
                <TimerIcon size={18} />
                <span>Timer</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="stopwatch" className="w-full">
              {/* select-none otherwise this gets selected when you're clicking circle and toggling states */}
              <div className="flex select-none items-center gap-2">
                <ClockIcon size={18} />
                <span>Stopwatch</span>
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timer">
            <Timer />
          </TabsContent>
          <TabsContent value="stopwatch">
            <Stopwatch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
