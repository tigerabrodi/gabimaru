import { Stopwatch } from "@/components/stopwatch";
// import { Timer } from "@/components/timer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Timer as TimerIcon } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="timer" className="w-full">
              {/* select-none otherwise this gets selected when you're clicking circle and toggling states */}
              <div className="flex items-center gap-2 select-none">
                <TimerIcon size={18} />
                <span>Timer</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="stopwatch" className="w-full">
              {/* select-none otherwise this gets selected when you're clicking circle and toggling states */}
              <div className="flex items-center gap-2 select-none">
                <Clock size={18} />
                <span>Stopwatch</span>
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timer">
            {/* <Timer /> */}
            <div>hello world</div>
          </TabsContent>
          <TabsContent value="stopwatch">
            <Stopwatch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
