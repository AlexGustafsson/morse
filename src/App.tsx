import TouchSurface from "./TouchSurface";

export default function (): JSX.Element {
  return (
    <>
      <header className="fixed w-full p-2 flex justify-center bg-white drop-shadow-sm">
        <h1 className="text-3xl font-bold">Morse</h1>
      </header>
      <main className="flex-1 mt-20">
        <TouchSurface className="w-full h-full" />
      </main>
    </>
  );
}
