import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ACTION_WIDTH = 88;

type SwipeableRowProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export function SwipeableRow({
  isOpen,
  onOpen,
  onClose,
  onDelete,
  children,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const position = useRef(0);
  const isOpenRef = useRef(isOpen);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  isOpenRef.current = isOpen;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      position.current = value;
    });
    return () => translateX.removeListener(listenerId);
  }, [translateX]);

  useEffect(() => {
    const toValue = isOpen ? -ACTION_WIDTH : 0;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
    }).start(() => {
      startX.current = toValue;
      position.current = toValue;
    });
  }, [isOpen, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        startX.current = position.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          0,
          Math.max(-ACTION_WIDTH, startX.current + gesture.dx),
        );
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const current = Math.min(
          0,
          Math.max(-ACTION_WIDTH, startX.current + gesture.dx),
        );
        const wasOpen = startX.current < -ACTION_WIDTH / 2;
        const nextOpen = wasOpen
          ? !(gesture.dx > 16 || gesture.vx > 0.15 || current > -ACTION_WIDTH / 2)
          : gesture.dx < -16 || gesture.vx < -0.25 || current < -ACTION_WIDTH / 2;
        const toValue = nextOpen ? -ACTION_WIDTH : 0;

        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          bounciness: 0,
        }).start(() => {
          startX.current = toValue;
          position.current = toValue;
        });

        if (nextOpen) {
          onOpenRef.current();
        } else {
          onCloseRef.current();
        }
      },
      onPanResponderTerminate: () => {
        const toValue = isOpenRef.current ? -ACTION_WIDTH : 0;
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          bounciness: 0,
        }).start(() => {
          startX.current = toValue;
          position.current = toValue;
        });
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.actionWrap}>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.front, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 0,
  },
  actionWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#E53935',
  },
  deleteButton: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  front: {
    backgroundColor: '#FFFFFF',
  },
});
