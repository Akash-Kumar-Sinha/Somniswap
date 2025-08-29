import { Button } from "./components/ui/button";

const App = () => {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-4xl font-bold'>Somnia Liquidity Pool</h1>
      <Button className='mt-4'>Connect Wallet</Button>
    </div>
  );
};
export default App;
