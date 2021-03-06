import { useEffect, useCallback, useRef } from 'react';

// React hook for delaying calls with time
// returns callback to use for cancelling

const useTimeout = (
  callback = () => {},
  timeout = 0,
) => {
    const timeoutIdRef = useRef()
    const cancel = useCallback(
        () => {
            const timeoutId = timeoutIdRef.current
            if (timeoutId) {
                timeoutIdRef.current = null
                clearTimeout(timeoutId)
            }
        },
        [timeoutIdRef],
    );

    useEffect(
        () => {
            timeoutIdRef.current = setTimeout(callback, timeout)
            return cancel
        },
        [callback, timeout, cancel],
    )

    return cancel
}

export default useTimeout
