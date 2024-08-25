import Worker from './hash-worker.ts?worker';
import { FilePiece } from '../custom-type';

interface Options {
  chunkList: FilePiece[];
  onTick?: (percentage: number) => void;
}

export const calHash = ({ chunkList, onTick }: Options) => {
  return new Promise(resolve => {
    const worker = new Worker();

    worker.postMessage({ chunkList });

    worker.onmessage = e => {
      const { hash, percentage } = e.data;
      onTick?.(percentage);
      if(hash){
        resolve(hash);
      }
    };
  });
};
