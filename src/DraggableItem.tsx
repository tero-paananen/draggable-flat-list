import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { DraggableFlatListItem } from './DraggableFlatList';

const DraggableItem = ({
  item,
  children,
  below,
  setRef,
  userIsScrollingUp,
  mode,
  itemHeight,
}: {
  item: DraggableFlatListItem;
  children?: JSX.Element;
  below?: string;
  setRef: (ref: React.RefObject<View>) => void;
  userIsScrollingUp: boolean | undefined;
  mode: 'default' | 'expands';
  itemHeight: number;
}) => {
  const itemRef = useRef<View>(null);

  const isBelow = item.id === below;

  const handleLayout = useCallback(() => {
    setRef(itemRef);
  }, [setRef]);

  const style = useMemo(() => {
    if (mode === 'default') {
      const color = isBelow ? '#ededed' : 'transparent';
      return { ...{ backgroundColor: color }, ...{ height: itemHeight } };
    } else {
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
