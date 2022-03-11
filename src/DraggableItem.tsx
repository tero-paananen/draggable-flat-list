import { FlatListItem } from './DraggableFlatList';
import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

const DraggableItem = ({
  itemData,
  children,
  below,
  setRef,
  userIsScrollingUp,
}: {
  itemData: FlatListItem;
  children?: JSX.Element;
  below?: string;
  setRef: (ref: React.RefObject<View>) => void;
  userIsScrollingUp: boolean | undefined;
}) => {
  const { item } = itemData;
  const itemRef = useRef<View>(null);

  const isBelow = item.id === below;

  const handleLayout = useCallback(() => {
    setRef(itemRef);
  }, [setRef]);

  const style = useMemo(() => {
    const height = isBelow ? item.height * 2 : item.height;
    return Boolean(userIsScrollingUp) === true
      ? [styles.up, { height: height }]
      : [styles.down, { height: height }];
  }, [isBelow, item.height, userIsScrollingUp]);

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
