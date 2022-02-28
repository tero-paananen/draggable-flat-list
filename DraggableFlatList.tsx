import React, {useMemo, useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
} from 'react-native';
import debounce from 'lodash/debounce';

export type Item = {
  id: string;
  height: number;
};

type FlatListItem = {
  item: InternalItem;
};

type InternalItem = {
  id: string;
  y: number;
  height: number;
};

type Layout = {y: number; height: number};

const CustomDraggableFlatList = ({
  data,
  renderItem,
  renderSelectedItem,
  style,
  onSelected,
  onHandleMove,
}: {
  data: Item[];
  renderItem: (itemData: FlatListItem) => JSX.Element;
  renderSelectedItem: (itemData: FlatListItem) => JSX.Element;
  style: any;
  onSelected: (item: Item | undefined) => void;
  onHandleMove: (fromIndex: number, toIndex: number) => void;
}) => {
  const [selected, setSelected] = useState<InternalItem | undefined>(undefined);
  const [below, setBelow] = useState<InternalItem | undefined>(undefined);
  const [layout, setLayout] = useState<{layout: Layout | undefined}>({
    layout: undefined,
  });

  const preparedDataRef = useRef<InternalItem[]>([]);
  const panningRef = useRef(false);
  const selectedRef = useRef<InternalItem | undefined>(undefined);
  const belowRef = useRef<InternalItem | undefined>(undefined);
  const layoutRef = useRef<Layout | undefined>(undefined);
  const previousOffsetY = useRef(0);
  const flatListRef = useRef<FlatList | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const startMoveYRef = useRef(-1);
  const currentMoveYRef = useRef(-1);
  const scrollAnimationRunning = useRef(false);
  const scrollOffsetY = useRef(0);

  const panResponder = React.useRef(
    // https://reactnative.dev/docs/panresponder
    // https://eveningkid.medium.com/the-basics-of-react-native-gestures-23061b5e89cf
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: () => {
        if (selectedRef.current) {
          // wser has done item selection
          // start capturing panning
          return true;
        } else {
          // user can scroll FlatList
          return false;
        }
      },
      // onMoveShouldSetPanResponderCapture: () => true, // iOS: FlatList is not scrollable if true
      onPanResponderGrant: () => {},

      onPanResponderMove: (event: any, gestureState: any) => {
        if (!layoutRef.current) {
          return;
        }
        const {moveX, moveY} = gestureState;
        if (startMoveYRef.current === -1) {
          startMoveYRef.current = moveY;
        }
        currentMoveYRef.current = moveY;

        pan.setValue({x: moveX, y: moveY});
        panningRef.current = true;

        if (isMovingEnought(moveY)) {
          handleScrollToPosition();
          showWhereToDrop(moveY, preparedDataRef.current);
        }
      },

      onPanResponderTerminationRequest: () => true,

      onPanResponderRelease: (event: any, gestureState: any) => {
        const {moveY} = gestureState;
        const releasedOnItem = itemFromTouchPoint(
          moveY,
          preparedDataRef.current,
        );
        selectedRef.current &&
          releasedOnItem &&
          handleMove(selectedRef.current, releasedOnItem);
        endPanning();
      },

      onPanResponderTerminate: () => {
        endPanning();
      },

      onShouldBlockNativeResponder: () => {
        return true;
      },
    }),
  ).current;

  const callOnScroll = useRef(
    debounce(
      () => {
        if (panningRef.current) {
          scrollAnimationRunning.current = false;
        }
      },
      1000,
      {leading: false, trailing: true},
    ),
  );

  const handleMove = (sourceItem: InternalItem, targetItem: InternalItem) => {
    if (sourceItem && targetItem) {
      const fromIndex = dataIndexFromItem(sourceItem);
      const toIndex = dataIndexFromItem(targetItem);
      onHandleMove(fromIndex, toIndex);
    }
  };

  const endPanning = () => {
    setSelected(undefined);
    setBelow(undefined);
    pan.setValue({x: 0, y: 0});
    panningRef.current = false;
    startMoveYRef.current = -1;
    currentMoveYRef.current = -1;
    scrollAnimationRunning.current = false;
  };

  const showWhereToDrop = (moveY: number, preparedData: InternalItem[]) => {
    const item = itemFromTouchPoint(moveY, preparedData);
    setBelow(item);
  };

  const positionYonFlatList = (moveY: number) => {
    return moveY - (layoutRef.current?.y || 0) + scrollOffsetY.current;
  };

  const itemFromTouchPoint = (moveY: number, preparedData: InternalItem[]) => {
    if (!layoutRef.current || preparedData.length === 0) {
      return;
    }
    const y = positionYonFlatList(moveY);
    const index = preparedData.findIndex(
      (d: InternalItem) => y > d.y && y < d.y + d.height,
    );
    return index !== -1 ? preparedData[index] : undefined;
  };

  const dataIndexFromItem = (item: InternalItem) => {
    return preparedDataRef.current.findIndex(d => d.id === item.id);
  };

  const isMovingEnought = (moveY: number) => {
    const TRESHOLD_PIXELS = 4;
    if (
      selectedRef.current &&
      layoutRef.current &&
      Math.abs(previousOffsetY.current - moveY) > TRESHOLD_PIXELS
    ) {
      previousOffsetY.current = moveY;
      return true;
    }
    return false;
  };

  const handleScrollToPosition = () => {
    // scroll flatlist to up or down
    if (
      !panningRef.current ||
      scrollAnimationRunning.current ||
      !layoutRef.current
    ) {
      return;
    }

    const userScrollingUp = startMoveYRef.current > currentMoveYRef.current; // user is panning up or down
    const tresholdTop = layoutRef.current.height * 0.1; // top view area for scrolling up
    const tresholdBottom = layoutRef.current.height * 0.9; // bottom view are for scrolling down
    if (
      currentMoveYRef.current > tresholdTop &&
      currentMoveYRef.current < tresholdBottom
    ) {
      // No scrolling
      return;
    }

    // cap is min pointer cap to top or bottom of FlatList
    const cap = Math.min(
      currentMoveYRef.current,
      layoutRef.current.height - currentMoveYRef.current,
    );

    // amount of fixels to scroll in one animation request
    // if pointer (cap value) is near top of bottom is scroll animation faster
    const amount = cap < 5 ? 75 : Platform.OS === 'windows' ? 30 : 50;
    const offset = scrollOffsetY.current + (userScrollingUp ? -amount : amount); // amount of scrolling
    if (offset < 0) {
      // Try to scroll too high
      return;
    }
    scrollAnimationRunning.current = true;
    flatListRef.current?.scrollToOffset({offset, animated: true}); // scroll
    callOnScroll.current(); // call onScroll delayed because it is not always called on end of FlatList reached
  };

  const preparedData = useMemo(() => {
    const ret: InternalItem[] = [];
    let y = 0;
    data.map(item => {
      const itemHeight = item.height;
      ret.push({
        ...item,
        ...{
          y,
          height: itemHeight,
        },
      });
      y += itemHeight;
    });
    return ret;
  }, [data]);

  useEffect(() => {
    preparedDataRef.current = preparedData;
    selectedRef.current = selected;
    layoutRef.current = layout?.layout;
    belowRef.current = below;
  }, [below, layout?.layout, preparedData, selected]);

  const handleItemSelection = useCallback(
    (item: InternalItem) => {
      if (selected?.id === item.id) {
        setSelected(undefined);
        onSelected(undefined);
      } else {
        setSelected(item);
        onSelected({id: item.id, height: item.height});
      }
    },
    [onSelected, selected],
  );

  const renderFlatListItem = (itemData: FlatListItem) => {
    if (!panningRef.current && selected?.id === itemData.item.id) {
      return (
        <CustomFlatListItem
          itemData={itemData}
          onSelected={handleItemSelection}>
          {renderSelectedItem(itemData)}
        </CustomFlatListItem>
      );
    } else {
      return (
        <CustomFlatListItem
          itemData={itemData}
          below={below?.id}
          onSelected={handleItemSelection}>
          {renderItem(itemData)}
        </CustomFlatListItem>
      );
    }
  };

  const renderFlyingItem = () => {
    if (selected && panningRef.current && layout.layout) {
      return (
        <Animated.View
          style={[
            styles.flying,
            {top: -layout.layout.y * 1.5},
            {transform: [{translateY: pan.y}]},
          ]}>
          {renderItem({item: selected})}
        </Animated.View>
      );
    } else {
      return null;
    }
  };

  const handleLayout = useCallback((e: any) => {
    setLayout({layout: e.nativeEvent.layout});
  }, []);

  const handleScroll = useCallback((e: any) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
    scrollAnimationRunning.current = false;
    panningRef.current && handleScrollToPosition();
  }, []);

  const containerStyle = useMemo(() => {
    return {...styles.container, ...style};
  }, [style]);

  return (
    <View
      style={containerStyle}
      {...panResponder.panHandlers}
      onLayout={handleLayout}>
      <Animated.FlatList
        style={styles.list}
        ref={flatListRef}
        keyExtractor={(item: InternalItem) => item.id}
        data={preparedData}
        extraData={{id: below?.id}}
        scrollEnabled={true}
        onEndReachedThreshold={0}
        scrollEventThrottle={0}
        onScroll={handleScroll}
        renderItem={renderFlatListItem}
      />
      {renderFlyingItem()}
    </View>
  );
};

const CustomFlatListItem = ({
  itemData,
  onSelected,
  children,
  below,
}: {
  itemData: FlatListItem;
  onSelected: (item: InternalItem) => void;
  children?: JSX.Element;
  below?: string;
}) => {
  const {item} = itemData;
  const isBelow = item.id === below;

  const handleSelected = useCallback(() => {
    onSelected(item);
  }, [item, onSelected]);

  const style = useMemo(() => {
    const color = isBelow ? 'darkgray' : 'transparent';
    return {...{backgroundColor: color}, ...{height: item.height}};
  }, [isBelow, item.height]);

  if (isBelow) {
    return <View style={style} />;
  } else {
    return (
      <TouchableWithoutFeedback style={style} onPress={handleSelected}>
        {children}
      </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  flying: {
    position: 'absolute',
    backgroundColor: 'lightgray',
  },
});

export default CustomDraggableFlatList;
