import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { DraggableFlatListItem } from './DraggableFlatList';

type DraggableItemType = {
  item: DraggableFlatListItem;
  children?: JSX.Element;
  below?: string;
  setRef: (ref: React.RefObject<View>) => void;
  userIsScrollingUp: boolean | undefined;
  mode: 'default' | 'expands';
  itemHeight: number;
};

const DraggableItem = ({
  item,
  children,
  below,
  setRef,
  userIsScrollingUp,
  mode,
  itemHeight,
}: DraggableItemType) => {
  const itemRef = useRef<View>(null);
  const isBelow = item.key === below;
  const color = isBelow ? '#ededed' : 'transparent';

  const baseStyle =
    mode === 'default'
      ? { ...{ backgroundColor: color }, ...{ height: itemHeight } }
      : Boolean(userIsScrollingUp) === true
      ? styles.up
      : styles.down;

  const animatedHeightRef = useRef(new Animated.Value(itemHeight));
  const style = { ...baseStyle, height: animatedHeightRef.current };

  const handleLayout = useCallback(() => {
    setRef(itemRef);
  }, [setRef]);

  useEffect(() => {
    const height = isBelow && mode === 'expands' ? itemHeight * 2 : itemHeight;
    Animated.spring(animatedHeightRef.current, {
      toValue: height,
      useNativeDriver: Platform.OS !== 'windows',
    }).start();
  }, [isBelow, itemHeight, mode]);

  return (
    <Animated.View style={style} ref={itemRef} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  up: {
    justifyContent: 'flex-end',
  },
  down: {
    justifyContent: 'flex-start',
  },
});

export default DraggableItem;
