import { useEffect, useState } from 'react';
import { api } from './api';

let cache = null; // categories rarely change, load them once

export function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    api.categories().then((data) => { cache = data; setCategories(data); }).catch(() => {});
  }, []);
  return categories;
}
