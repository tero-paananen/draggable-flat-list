import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform } from 'react-native';
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

  const handleLayout = useCallback(() => {
    setRef(itemRef);
  }, [setRef]);

  const style = useMemo(() => {
    if (mode === 'default') {
      const color = isBelow ? '#ededed' : 'transparent';
      return { ...{ backgroundColor: color }, ...{ height: itemHeight } };
    } else {
      Platform.OS === 'ios' && isBelow && LayoutAnimation.easeInEaseOut();
      const height = isBelow ? itemHeight * 2 : itemHeight;
      return Boolean(userIsScrollingUp) === true
        ? [styles.up, { height: height }]
        : [styles.down, { height: height }];
    }
  }, [isBelow, itemHeight, mode, userIsScrollingUp]);

  return (
    <View style={style} ref={itemRef} onLayout={handleLayout}>
      {children}
    </View>
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
