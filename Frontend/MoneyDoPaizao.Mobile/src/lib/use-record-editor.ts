import { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

export function useRecordEditor<T>(populate: (record: T | null) => void, initiallyOpen = false) {
  const [record, setRecord] = useState<T | null>(null);
  const [open, setOpen] = useState(initiallyOpen);
  const scrollRef = useRef<ScrollView>(null);

  function show(next: T | null) {
    populate(next);
    setRecord(next);
    setOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function close() {
    setOpen(false);
    setRecord(null);
  }

  function toggle() {
    if (open) close();
    else show(null);
  }

  return { record, open, show, close, toggle, scrollRef };
}
