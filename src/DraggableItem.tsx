import {FlatListItem} from './DraggableFlatList';
import React, {useMemo, useCallback, useRef} from 'react';
import {View} from 'react-native';

const DraggableItem = ({
  itemData,
  children,
  below,
  setRef,
}: {
  itemData: FlatListItem;
  children?: JSX.Element;
  below?: string;
  setRef: (ref: React.RefObject<View>) => void;
}) => {
  const {item} = itemData;
  const isBelow = item.id === below;
  const itemRef = useRef<View>(null);

  const handleLayout = useCallback(() => {
    setRef(itemRef); // only get reference into item
  }, [setRef]);

  const style = useMemo(() => {
    const color = isBelow ? '#ededed' : 'transparent';
    return {...{backgroundColor: color}, ...{height: item.height}};
  }, [isBelow, item.height]);

  return (
    <View style={style} ref={itemRef} onLayout={handleLayout}>
      {children}
    </View>
  );
};

export default DraggableItem;
